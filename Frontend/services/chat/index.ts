import { axiosInstance } from "@/utils/httpClient";
import type { Chat, ChatListResponse, ChatSendResponse, Message } from "./types";

function unwrap<T>(res: { data: { status: number; message: string; data: T } }): T {
  if (res.data.status !== 0) throw new Error(res.data.message || "Request failed");
  return res.data.data;
}

export const chatsApi = {
  list: async (): Promise<ChatListResponse> => unwrap<ChatListResponse>(await axiosInstance.get("/chats")),
  create: async (bookingId: string): Promise<{ chat: Chat }> =>
    unwrap(await axiosInstance.post("/chats", { bookingId })),
  details: async (chatId: string): Promise<{ chat: Chat; viewerRole: "member" | "host" }> =>
    unwrap(await axiosInstance.get(`/chats/${chatId}`)),
  send: async (chatId: string, text: string): Promise<ChatSendResponse> =>
    unwrap<ChatSendResponse>(await axiosInstance.post(`/chats/${chatId}/message`, { text })),
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
