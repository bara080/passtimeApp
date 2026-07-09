import { View, Text, Pressable, Image } from "react-native";
import { Calendar, Clock, User } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import { StatusPill } from "./StatusPill";
import type { Booking } from "@/services/bookings/types";

export type BookingListRowProps = {
  booking: Booking;
  /** Who is viewing — controls whose snapshot to show. */
  viewerRole: "member" | "host";
  onPress: () => void;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" });
}
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** Row on the My bookings list (Figma 1288:8595). */
export function BookingListRow({ booking, viewerRole, onPress }: BookingListRowProps) {
  const { palette } = useThemeColors();
  const other = viewerRole === "member" ? booking.hostSnapshot : booking.memberSnapshot;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open booking with ${other.displayName}`}
      className="flex-row items-center gap-3 rounded-[12px] border p-3 mb-3"
      style={{ borderColor: palette.border, backgroundColor: palette.surface }}
    >
      {other.photoUrl ? (
        <Image source={{ uri: other.photoUrl }} className="w-14 h-14 rounded-[10px]" />
      ) : (
        <View className="w-14 h-14 rounded-[10px] items-center justify-center bg-[#f0f0f0] dark:bg-[#1a1a1a]">
          <User size={26} color={palette.textMuted} />
        </View>
      )}
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-[15px] font-semibold" style={{ color: palette.textPrimary }} numberOfLines={1}>
            {other.displayName}
          </Text>
          <StatusPill status={booking.status} />
        </View>
        <View className="flex-row items-center gap-3 mt-0.5">
          <View className="flex-row items-center gap-1">
            <Calendar size={12} color={palette.textMuted} />
            <Text className="text-xs" style={{ color: palette.textMuted }}>
              {formatDate(booking.startAt)}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Clock size={12} color={palette.textMuted} />
            <Text className="text-xs" style={{ color: palette.textMuted }}>
              {formatTime(booking.startAt)}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
