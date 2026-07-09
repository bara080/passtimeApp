import type { NotificationType } from "@/services/notifications/types";

/** Central `type + data → route` map. This is Zinga's missing piece — every
 *  tap on a notification lands the user on the right screen. Extend here as
 *  new notification types come online. */
export function routeForNotificationData(
  type: NotificationType,
  data: Record<string, unknown>
): { pathname: string; params?: Record<string, string> } | null {
  const bookingId = typeof data.bookingId === "string" ? data.bookingId : null;
  const chatId = typeof data.chatId === "string" ? data.chatId : null;

  switch (type) {
    case "booking_request":
    case "booking_accepted":
    case "booking_declined":
    case "booking_cancelled":
    case "booking_reminder":
    case "payment_success":
      if (bookingId) return { pathname: "/(app)/bookings/[bookingId]", params: { bookingId } };
      return null;
    case "chat_message":
      if (chatId) return { pathname: "/(app)/messages", params: { chatId } };
      return null;
    case "general":
      return null;
  }
}
