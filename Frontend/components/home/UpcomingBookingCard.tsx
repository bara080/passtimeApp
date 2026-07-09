import { View, Text, Pressable, Image } from "react-native";
import { Calendar, MapPin, User } from "lucide-react-native";
import { GradientButton } from "@/components/auth/GradientButton";
import { AppButton } from "@/components/ui";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { Booking } from "@/services/bookings/types";

function formatDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  return isToday
    ? `Today, ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
    : d.toLocaleString(undefined, { weekday: "short", day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" });
}

export type UpcomingBookingCardProps = {
  booking: Booking;
  onView: () => void;
  onChat: () => void;
  /** Green-badge accent variant for confirmed / active bookings (Figma 6431). */
  active?: boolean;
};

/** Home card that shows the closest upcoming or current booking. */
export function UpcomingBookingCard({ booking, onView, onChat, active }: UpcomingBookingCardProps) {
  const { palette } = useThemeColors();
  const host = booking.hostSnapshot;

  return (
    <Pressable
      onPress={onView}
      className="rounded-[14px] border p-3 mt-3"
      style={{
        borderColor: active ? "#7cb342" : palette.border,
        backgroundColor: palette.surface,
      }}
    >
      <View className="flex-row items-center gap-2 mb-3">
        <Calendar size={14} color={active ? "#7cb342" : palette.accent} />
        <Text className="text-sm" style={{ color: palette.textPrimary }}>
          {formatDay(booking.startAt)}
        </Text>
      </View>
      <View className="flex-row items-center gap-3 mb-3">
        {host.photoUrl ? (
          <Image source={{ uri: host.photoUrl }} className="w-12 h-12 rounded-[10px]" />
        ) : (
          <View className="w-12 h-12 rounded-[10px] items-center justify-center bg-[#f0f0f0] dark:bg-[#1a1a1a]">
            <User size={22} color={palette.textMuted} />
          </View>
        )}
        <View className="flex-1">
          <Text className="text-base font-semibold" style={{ color: palette.textPrimary }} numberOfLines={1}>
            {host.displayName}
          </Text>
          {host.professionalRole ? (
            <Text className="text-xs" style={{ color: palette.textMuted }}>
              {host.professionalRole}
            </Text>
          ) : null}
          <View className="flex-row items-center gap-1 mt-0.5">
            <MapPin size={11} color={palette.textMuted} />
            <Text className="text-xs" style={{ color: palette.textMuted }} numberOfLines={1}>
              {booking.venue.name}
            </Text>
          </View>
        </View>
      </View>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <AppButton label="View" onPress={onView} variant="secondary" />
        </View>
        <View className="flex-1">
          <GradientButton label="Chat" onPress={onChat} />
        </View>
      </View>
    </Pressable>
  );
}
