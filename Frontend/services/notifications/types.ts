export type NotificationType =
  | "booking_request"
  | "booking_accepted"
  | "booking_declined"
  | "booking_cancelled"
  | "booking_reminder"
  | "payment_success"
  | "chat_message"
  | "general";

export type NotificationRecord = {
  _id: string;
  uid: string;
  role: "member" | "host";
  title: string;
  body: string;
  type: NotificationType;
  data: Record<string, string | number | boolean>;
  key?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FeedResponse = {
  notifications: NotificationRecord[];
  unreadCount: number;
};

export type SavePushTokenPayload = {
  token: string;
  platform?: "ios" | "android";
};
