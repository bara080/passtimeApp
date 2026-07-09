import { View, Text, Pressable } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { Slot } from "@/services/bookings/types";

export type SlotRowProps = {
  slot: Slot;
  onPress: (slot: Slot) => void;
};

const AVAILABLE_BG_LIGHT = "#7cb342";
const AVAILABLE_BG_DARK = "#2a4711";
const UNAVAILABLE_BG_LIGHT = "#e5e7eb";
const UNAVAILABLE_BG_DARK = "#333333";

function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

/** One slot row from Figma 1288:7631: hour label at left, green "Select…" pill or grey "Booked"/"Not available". */
export function SlotRow({ slot, onPress }: SlotRowProps) {
  const { palette, isDark } = useThemeColors();
  const startLabel = to12h(slot.start);
  const hourLabel = startLabel.replace(":00 ", " ");

  if (!slot.available) {
    const label = slot.reason === "booked" ? "Booked" : "Not available";
    return (
      <View className="flex-row items-center mb-2 gap-3">
        <Text className="w-[70px] text-sm" style={{ color: palette.textMuted }}>
          {hourLabel}
        </Text>
        <View
          className="flex-1 h-12 rounded-[10px] items-center justify-center"
          style={{ backgroundColor: isDark ? UNAVAILABLE_BG_DARK : UNAVAILABLE_BG_LIGHT }}
        >
          <Text className="text-sm" style={{ color: palette.textMuted }}>
            {label}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-row items-center mb-2 gap-3">
      <Text className="w-[70px] text-sm" style={{ color: palette.textPrimary }}>
        {hourLabel}
      </Text>
      <Pressable
        onPress={() => onPress(slot)}
        accessibilityRole="button"
        accessibilityLabel={`Select ${startLabel}`}
        className="flex-1 h-12 rounded-[10px] flex-row items-center justify-between px-5"
        style={{ backgroundColor: isDark ? AVAILABLE_BG_DARK : AVAILABLE_BG_LIGHT }}
      >
        <Text className="text-base font-medium text-white">Select {startLabel}</Text>
        <ChevronRight size={18} color="#ffffff" />
      </Pressable>
    </View>
  );
}
