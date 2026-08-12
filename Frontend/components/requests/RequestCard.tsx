import { View, Text, Pressable, Image } from "react-native";
import { Clock, Timer, MapPin, User } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import { experienceMeta } from "@/components/onboarding/experienceTypes.data";
import { formatMoney } from "@/utils/bookingMoney";
import type { Booking } from "@/services/bookings/types";

export type RequestCardProps = {
  booking: Booking;
  onPress: () => void;
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
function humanDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Pending booking-request card for the host Requests tab (Figma 1288:14959).
 *  Member avatar + name + category, a soft price chip, then a time / duration /
 *  venue meta row under a divider. */
export function RequestCard({ booking, onPress }: RequestCardProps) {
  const { palette, isDark } = useThemeColors();
  const member = booking.memberSnapshot;
  const meta = experienceMeta(booking.category);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Booking request from ${member.displayName}`}
      className="rounded-[14px] border p-3.5 mb-3"
      style={{ borderColor: palette.border, backgroundColor: palette.surface }}
    >
      <View className="flex-row items-center gap-3">
        {member.photoUrl ? (
          <Image source={{ uri: member.photoUrl }} className="w-11 h-11 rounded-full" />
        ) : (
          <View className="w-11 h-11 rounded-full items-center justify-center bg-[#f0f0f0] dark:bg-[#242424]">
            <User size={22} color={palette.textMuted} />
          </View>
        )}
        <View className="flex-1">
          <Text className="text-[15px] font-semibold" style={{ color: palette.textPrimary }} numberOfLines={1}>
            {member.displayName}
          </Text>
          <Text className="text-[13px] mt-0.5" style={{ color: palette.textMuted }} numberOfLines={1}>
            {meta.label}
          </Text>
        </View>
        <View
          className="rounded-full px-2.5 py-1"
          style={{ backgroundColor: isDark ? "#3a2415" : "#fff3ec" }}
        >
          <Text className="text-[12px] font-semibold" style={{ color: palette.accent }}>
            {formatMoney(booking.total, booking.currency)}
          </Text>
        </View>
      </View>

      <View className="h-[1px] my-3" style={{ backgroundColor: palette.border }} />

      <View className="flex-row items-center">
        <MetaItem Icon={Clock} label={formatTime(booking.startAt)} color={palette.textMuted} />
        <MetaItem Icon={Timer} label={humanDuration(booking.durationMinutes)} color={palette.textMuted} />
        <MetaItem Icon={MapPin} label={booking.venue?.name || "Venue TBD"} color={palette.textMuted} flex />
      </View>
    </Pressable>
  );
}

function MetaItem({
  Icon,
  label,
  color,
  flex,
}: {
  Icon: typeof Clock;
  label: string;
  color: string;
  flex?: boolean;
}) {
  return (
    <View className={`flex-row items-center gap-1.5 ${flex ? "flex-1 pl-4" : "pr-4"}`}>
      <Icon size={15} color={color} />
      <Text className="text-[12px]" style={{ color }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
