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
  const { user } = useAuth();
  const feed = useChatList(Boolean(user));

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
