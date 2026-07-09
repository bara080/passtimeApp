export type ChatStatus = "open" | "closed";

/** Server-side conversation row (Mongo metadata + viewer decoration). */
export type Chat = {
  chatId: string;
  bookingId: string;
  memberUid: string;
  hostUid: string;
  status: ChatStatus;
  lastMessage: string;
  lastMessageAt: string | null;
  lastReadAt: { member: string | null; host: string | null };
  clearedAtBy: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  /** Set by GET /chats server-side. */
  viewerRole: "member" | "host";
  unread: boolean;
};

export type ChatListResponse = { chats: Chat[]; unreadCount: number };
export type ChatSendResponse = { chat: Chat; messageId: string };

/** Fresh profile of a chat participant returned by GET /chats/:id. */
export type ChatParticipantProfile = {
  uid: string;
  displayName: string | null;
  avatarUrl: string | null;
  professionalRole: string | null;
};

export type ChatDetailsResponse = {
  chat: Chat;
  viewerRole: "member" | "host";
  memberProfile: ChatParticipantProfile | null;
  hostProfile: ChatParticipantProfile | null;
};

/** Historical message pulled from GET /chats/:chatId/messages (or via RTDB listener). */
export type Message = {
  id: string;
  sender: string;
  senderRole: "member" | "host";
  senderName: string;
  text: string;
  timestamp: number;
};
