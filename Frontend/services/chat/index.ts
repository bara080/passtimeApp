import { axiosInstance } from "@/utils/httpClient";
import { withSingleFlight } from "@/utils/singleFlight";
import type { Chat, ChatListResponse, ChatSendResponse, ChatDetailsResponse, Message } from "./types";

function unwrap<T>(res: { data: { status: number; message: string; data: T } }): T {
  if (res.data.status !== 0) throw new Error(res.data.message || "Request failed");
  return res.data.data;
}

export const chatsApi = {
  list: async (): Promise<ChatListResponse> => unwrap<ChatListResponse>(await axiosInstance.get("/chats")),
  // Chats are idempotent on bookingId server-side; single-flight collapses the
  // burst so we don't fire N concurrent creates for one "Message host" tap.
  create: async (bookingId: string): Promise<{ chat: Chat }> =>
    withSingleFlight(`chat-create:${bookingId}`, async () =>
      unwrap(await axiosInstance.post("/chats", { bookingId }))),
  details: async (chatId: string): Promise<ChatDetailsResponse> =>
    unwrap(await axiosInstance.get(`/chats/${chatId}`)),
  // Keyed by chat+text: a double-tapped send shares one request. Distinct
  // messages (different text) never collide; the map clears once each settles.
  send: async (chatId: string, text: string): Promise<ChatSendResponse> =>
    withSingleFlight(`chat-send:${chatId}:${text}`, async () =>
      unwrap<ChatSendResponse>(await axiosInstance.post(`/chats/${chatId}/message`, { text }))),
  history: async (chatId: string): Promise<{ messages: Message[] }> =>
    unwrap(await axiosInstance.get(`/chats/${chatId}/messages`)),
  markRead: async (chatId: string): Promise<Record<string, never>> =>
    unwrap(await axiosInstance.post(`/chats/${chatId}/read`)),
  clear: async (chatId: string): Promise<Record<string, never>> =>
    unwrap(await axiosInstance.post(`/chats/${chatId}/clear`)),
  close: async (chatId: string): Promise<{ chat: Chat }> =>
    unwrap(await axiosInstance.post(`/chats/${chatId}/close`)),
};

export * from "./types";
