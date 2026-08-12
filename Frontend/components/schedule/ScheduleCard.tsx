import { View, Text, Pressable, Image } from "react-native";
import { ArrowRight, User } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import { experienceMeta } from "@/components/onboarding/experienceTypes.data";
import type { Booking } from "@/services/bookings/types";

export type ScheduleCardProps = {
  booking: Booking;
  onPress: () => void;
};

function timeRange(startIso: string, endIso: string): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }).replace(/^0/, "");
  return `${fmt(startIso)} to ${fmt(endIso)}`;
}

/** A booked slot on the host Schedule timeline (Figma 1288:12871). Soft peach
 *  card: category icon + label, a "View details" affordance, and the member +
 *  time range on the second row. */
export function ScheduleCard({ booking, onPress }: ScheduleCardProps) {
  const { palette, isDark } = useThemeColors();
  const meta = experienceMeta(booking.category);
  const member = booking.memberSnapshot;
  const Icon = meta.Icon;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${meta.label} with ${member.displayName}`}
      className="flex-1 rounded-[12px] p-3"
      style={{ backgroundColor: isDark ? "#2a1c14" : "#fdeee8" }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 flex-1 pr-2">
          <Icon size={18} color={palette.accent} />
          <Text className="text-[14px] font-semibold" style={{ color: palette.textPrimary }} numberOfLines={1}>
            {meta.label}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Text className="text-[12px] font-medium" style={{ color: palette.accent }}>
            View details
          </Text>
          <ArrowRight size={13} color={palette.accent} />
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-2.5">
        <View className="flex-row items-center gap-2 flex-1 pr-2">
          {member.photoUrl ? (
            <Image source={{ uri: member.photoUrl }} className="w-5 h-5 rounded-full" />
          ) : (
            <View className="w-5 h-5 rounded-full items-center justify-center bg-[#e8ddd6] dark:bg-[#3a2c22]">
              <User size={12} color={palette.textMuted} />
            </View>
          )}
          <Text className="text-[13px]" style={{ color: palette.textPrimary }} numberOfLines={1}>
            {member.displayName}
          </Text>
        </View>
        <Text className="text-[11px]" style={{ color: palette.textMuted }}>
          {timeRange(booking.startAt, booking.endAt)}
        </Text>
      </View>
    </Pressable>
  );
}
