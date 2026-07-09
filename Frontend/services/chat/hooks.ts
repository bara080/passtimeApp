import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatsApi } from "./index";
import { trackEvent, trackError } from "@/utils/analytics";

const STALE_MS = 30 * 1000;

export function useChatList(enabled: boolean) {
  return useQuery({
    queryKey: ["chats", "list"],
    queryFn: chatsApi.list,
    enabled,
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
  });
}

export function useChatDetails(chatId: string | null) {
  return useQuery({
    queryKey: ["chats", "details", chatId],
    queryFn: () => chatsApi.details(chatId!),
    enabled: Boolean(chatId),
    staleTime: STALE_MS,
  });
}

/** Cold-start message history — the RTDB listener replaces this once mounted. */
export function useChatHistory(chatId: string | null) {
  return useQuery({
    queryKey: ["chats", "history", chatId],
    queryFn: () => chatsApi.history(chatId!),
    enabled: Boolean(chatId),
    staleTime: STALE_MS,
    select: (data) => data.messages,
  });
}

export function useCreateChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => {
      trackEvent("chat.create.submit", { bookingId });
      return chatsApi.create(bookingId);
    },
    onSuccess: (d) => {
      trackEvent("chat.create.success", { chatId: d.chat.chatId });
      qc.invalidateQueries({ queryKey: ["chats", "list"] });
    },
    onError: (err, bookingId) => trackError("chat.create", err, { bookingId }),
  });
}

export function useSendMessage(chatId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => {
      trackEvent("chat.message.send", { chatId });
      return chatsApi.send(chatId, text);
    },
    onSuccess: () => {
      trackEvent("chat.message.sent", { chatId });
      qc.invalidateQueries({ queryKey: ["chats", "list"] });
      qc.invalidateQueries({ queryKey: ["chats", "details", chatId] });
    },
    onError: (err) => trackError("chat.message", err, { chatId }),
  });
}

export function useMarkChatRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => chatsApi.markRead(chatId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chats", "list"] }),
  });
}

export function useCloseChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => chatsApi.close(chatId),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["chats", "list"] });
      qc.invalidateQueries({ queryKey: ["chats", "details", id] });
    },
  });
}

export function useClearChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => chatsApi.clear(chatId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chats", "list"] }),
  });
}
