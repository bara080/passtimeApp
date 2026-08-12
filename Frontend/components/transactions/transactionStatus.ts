import type { TransactionStatus } from "@/services/payments/types";

/** Status → accent color, shared by the list row icon and the detail screen.
 *  Mirrors the Figma legend (green = released, orange = pending, red = refunded). */
export function statusColor(status: TransactionStatus): string {
  switch (status) {
    case "succeeded":
      return "#7cb342"; // released — green
    case "pending":
      return "#ff9933"; // orange
    case "refunded":
      return "#f4511e"; // red-orange
    case "failed":
      return "#e5484d"; // red
    case "disputed":
      return "#f5a623"; // amber
    default:
      return "#6b6b6b";
  }
}

/** "11 Mar, 26 - 4:33 PM" — matches the Figma timestamp format. */
export function formatTxDate(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "2-digit" });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${date} - ${time}`;
}
