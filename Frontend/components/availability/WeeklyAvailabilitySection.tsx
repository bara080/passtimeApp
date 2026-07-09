import { View, Text } from "react-native";
import { DayAvailabilityCard } from "./DayAvailabilityCard";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { WeeklyDay } from "@/services/host/types";

export type WeeklyAvailabilitySectionProps = {
  value: WeeklyDay[];
  onChange: (value: WeeklyDay[]) => void;
};

/** Monday-first list of the seven day cards. */
export function WeeklyAvailabilitySection({ value, onChange }: WeeklyAvailabilitySectionProps) {
  const { palette } = useThemeColors();
  // Display Monday (1) through Sunday (0) while storing day indices 0–6.
  const displayOrder = [1, 2, 3, 4, 5, 6, 0];

  const setDay = (day: WeeklyDay) =>
    onChange(value.map((d) => (d.day === day.day ? day : d)));

  return (
    <View className="mb-6">
      <Text className="text-base font-semibold mb-3" style={{ color: palette.textPrimary }}>
        Weekly hours
      </Text>
      {displayOrder.map((dayIndex) => {
        const day = value.find((d) => d.day === dayIndex);
        return day ? <DayAvailabilityCard key={dayIndex} value={day} onChange={setDay} /> : null;
      })}
    </View>
  );
}
