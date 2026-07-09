// RTDB message + typing listeners for one chat, via @react-native-firebase/database.
//
// Why RNF (not the JS SDK): during the 2026-07-09 device test, the JS SDK's
// getDatabase() throws "Service database is not available" on Android even with
// a named app config. The native RNF module auto-initializes from
// google-services.json and Just Works. See chat.md §5a.

import database, { type FirebaseDatabaseTypes } from "@react-native-firebase/database";

export type RtdbMessage = {
  id: string;
  sender: string;
  senderRole: "member" | "host";
  senderName: string;
  text: string;
  timestamp: number;
};

export type TypingState = { uid: string; isTyping: boolean; timestamp: number };

const TYPING_STALE_MS = 5_000;

function db(): FirebaseDatabaseTypes.Module | null {
  try {
    return database();
  } catch (err) {
    if (__DEV__) console.warn("[firebase-rn] RTDB init failed; chat will use REST-only:", (err as Error)?.message);
    return null;
  }
}

/** Subscribe to the most recent N messages, oldest-first. Returns an unsubscribe. */
export function listenForMessages(
  chatId: string,
  onChange: (messages: RtdbMessage[]) => void,
  historyLimit = 200
): () => void {
  const rtdb = db();
  if (!rtdb) return () => {};
  const ref = rtdb.ref(`chats/${chatId}/messages`).limitToLast(historyLimit);
  const cb = ref.on("value", (snapshot) => {
    const raw = (snapshot.val() ?? {}) as Record<string, Omit<RtdbMessage, "id">>;
    const messages = Object.entries(raw)
      .map(([id, m]) => ({ id, ...m }))
      .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
    onChange(messages);
  });
  return () => ref.off("value", cb);
}

/** Subscribe to the counterparty's typing state (auto-clears stale writes). */
export function listenForTyping(
  chatId: string,
  myUid: string,
  onChange: (typing: TypingState | null) => void
): () => void {
  const rtdb = db();
  if (!rtdb) return () => {};
  const ref = rtdb.ref(`chats/${chatId}/typing`);
  const cb = ref.on("value", (snapshot) => {
    const raw = (snapshot.val() ?? {}) as Record<string, TypingState>;
    const other = Object.values(raw).find((t) => t.uid !== myUid && t.isTyping);
    if (!other) return onChange(null);
    if (Date.now() - (other.timestamp ?? 0) > TYPING_STALE_MS) return onChange(null);
    onChange(other);
  });
  return () => ref.off("value", cb);
}

/** Publish this user's typing state (rules restrict writes to auth.uid === $uid). */
export async function setTyping(chatId: string, myUid: string, isTyping: boolean): Promise<void> {
  const rtdb = db();
  if (!rtdb) return;
  const path = `chats/${chatId}/typing/${myUid}`;
  if (isTyping) {
    await rtdb.ref(path).set({ uid: myUid, isTyping: true, timestamp: Date.now() });
  } else {
    await rtdb.ref(path).remove();
  }
}
