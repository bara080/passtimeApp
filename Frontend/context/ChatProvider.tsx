import { createContext, useContext, useMemo, type PropsWithChildren } from "react";
import { useAuth } from "@/context/AuthProvider";
import { useChatList } from "@/services/chat/hooks";
import type { Chat } from "@/services/chat/types";

type Ctx = {
  chats: Chat[];
  unreadCount: number;
  loading: boolean;
};

const ChatContext = createContext<Ctx>({ chats: [], unreadCount: 0, loading: false });

/** Wraps `GET /chats` so the Messages tab badge and the list screen share one source of truth. */
export function ChatProvider({ children }: PropsWithChildren) {
  const { session, initializing } = useAuth();
  // old: const feed = useChatList(Boolean(user));
  // Poll only when we actually hold a session with an access token. `user` alone
  // could be truthy while tokens are absent/cleared (startup race, post-logout,
  // failed refresh) — which sent unauthenticated /chats requests in a 401 flood.
  // `session` is nulled by clearTokensAndLogout, so polling stops the moment auth drops.
  const feed = useChatList(!initializing && Boolean(session?.accessToken));

  const value = useMemo<Ctx>(
    () => ({
      chats: feed.data?.chats ?? [],
      unreadCount: feed.data?.unreadCount ?? 0,
      loading: feed.isPending,
    }),
    [feed.data, feed.isPending]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChats() {
  return useContext(ChatContext);
}
