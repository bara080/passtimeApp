import { View, Text } from "react-native";
import type { BookingStatus } from "@/services/bookings/types";

type Palette = { bg: string; fg: string; label: string };

// Colors sampled from Figma 9916, 9974, 10036, 10217, 10095.
const STATUS: Record<BookingStatus, Palette> = {
  pending:          { bg: "#fff3ec", fg: "#ff6633", label: "Pending" },
  accepted:         { bg: "#fff3ec", fg: "#ff6633", label: "Accepted" },
  declined:         { bg: "#fdecea", fg: "#c62828", label: "Declined" },
  confirmed:        { bg: "#e6f4ea", fg: "#2e7d32", label: "Confirmed" },
  active:           { bg: "#e6f4ea", fg: "#2e7d32", label: "In progress" },
  completed:        { bg: "#eef2ff", fg: "#3949ab", label: "Completed" },
  cancelled_member: { bg: "#fdecea", fg: "#c62828", label: "You cancelled" },
  cancelled_host:   { bg: "#fdecea", fg: "#c62828", label: "Host cancelled" },
  expired_unpaid:   { bg: "#fdecea", fg: "#c62828", label: "Cancelled — unpaid" },
};

export type StatusPillProps = {
  status: BookingStatus;
  /** Override the label (e.g. append "· Unpaid" from parent). */
  labelOverride?: string;
};

/** Single source of truth for status color + copy across list rows, details, and action bars. */
export function StatusPill({ status, labelOverride }: StatusPillProps) {
  const style = STATUS[status];
  return (
    <View className="self-start rounded-full px-3 py-1" style={{ backgroundColor: style.bg }}>
      <Text className="text-xs font-semibold" style={{ color: style.fg }}>
        {labelOverride ?? style.label}
      </Text>
    </View>
  );
}
