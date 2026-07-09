// RTDB message + typing listeners for one chat. Adapted from Zinga's
// Frontend/services/firebase/chat.service.ts (see chat.md §R1). Chat metadata
// (list, unread) stays REST-driven; only live message and typing streams go
// through here.

import { ref, onValue, off, set, remove, query, limitToLast } from "firebase/database";
import { getRealtimeDb } from "./config";

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

/** Subscribe to the most recent N messages, oldest-first. Returns an unsubscribe. */
export function listenForMessages(
  chatId: string,
  onChange: (messages: RtdbMessage[]) => void,
  historyLimit = 200
): () => void {
  const db = getRealtimeDb();
  if (!db) return () => {};
  const messagesRef = query(ref(db, `chats/${chatId}/messages`), limitToLast(historyLimit));
  const cb = (snapshot: import("firebase/database").DataSnapshot) => {
    const raw = (snapshot.val() ?? {}) as Record<string, Omit<RtdbMessage, "id">>;
    const messages = Object.entries(raw)
      .map(([id, m]) => ({ id, ...m }))
      .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
    onChange(messages);
  };
  onValue(messagesRef, cb);
  return () => off(messagesRef, "value", cb);
}

/** Subscribe to the counterparty's typing state (auto-clears stale writes). */
export function listenForTyping(
  chatId: string,
  myUid: string,
  onChange: (typing: TypingState | null) => void
): () => void {
  const db = getRealtimeDb();
  if (!db) return () => {};
  const typingRef = ref(db, `chats/${chatId}/typing`);
  const cb = (snapshot: import("firebase/database").DataSnapshot) => {
    const raw = (snapshot.val() ?? {}) as Record<string, TypingState>;
    const other = Object.values(raw).find((t) => t.uid !== myUid && t.isTyping);
    if (!other) return onChange(null);
    if (Date.now() - (other.timestamp ?? 0) > TYPING_STALE_MS) return onChange(null);
    onChange(other);
  };
  onValue(typingRef, cb);
  return () => off(typingRef, "value", cb);
}

/** Publish this user's typing state (rules restrict writes to auth.uid === $uid). */
export async function setTyping(chatId: string, myUid: string, isTyping: boolean): Promise<void> {
  const db = getRealtimeDb();
  if (!db) return;
  const path = `chats/${chatId}/typing/${myUid}`;
  if (isTyping) {
    await set(ref(db, path), { uid: myUid, isTyping: true, timestamp: Date.now() });
  } else {
    await remove(ref(db, path));
  }
}
