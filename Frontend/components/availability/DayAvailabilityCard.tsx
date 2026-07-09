import { View, Text } from "react-native";
import { ToggleSwitch } from "@/components/ui";
import { TimeRangeRow } from "./TimeRangeRow";
import { AddTimeButton } from "./AddTimeButton";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { WeeklyDay, TimeRange } from "@/services/host/types";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MAX_RANGES = 4;
const DEFAULT_RANGE: TimeRange = { start: "09:00", end: "17:00" };

export type DayAvailabilityCardProps = {
  value: WeeklyDay;
  onChange: (value: WeeklyDay) => void;
};

/** One weekday's card: name + toggle; time ranges + add button when enabled. */
export function DayAvailabilityCard({ value, onChange }: DayAvailabilityCardProps) {
  const { palette } = useThemeColors();

  const setEnabled = (enabled: boolean) =>
    onChange({
      ...value,
      enabled,
      ranges: enabled && value.ranges.length === 0 ? [DEFAULT_RANGE] : value.ranges,
    });

  const setRange = (i: number, range: TimeRange) =>
    onChange({ ...value, ranges: value.ranges.map((r, idx) => (idx === i ? range : r)) });

  const addRange = () => {
    const last = value.ranges[value.ranges.length - 1];
    const next: TimeRange = last ? { start: last.end, end: "23:30" } : DEFAULT_RANGE;
    onChange({ ...value, ranges: [...value.ranges, next] });
  };

  const removeRange = (i: number) =>
    onChange({ ...value, ranges: value.ranges.filter((_, idx) => idx !== i) });

  return (
    <View
      className="rounded-[12px] border p-4 mb-3 bg-white dark:bg-[#1a1a1a]"
      style={{ borderColor: palette.border }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-medium" style={{ color: palette.textPrimary }}>
          {DAY_NAMES[value.day]}
        </Text>
        <ToggleSwitch value={value.enabled} onValueChange={setEnabled} />
      </View>

      {value.enabled ? (
        <View className="mt-1">
          {value.ranges.map((range, i) => (
            <TimeRangeRow
              key={i}
              value={range}
              onChange={(r) => setRange(i, r)}
              onRemove={value.ranges.length > 1 ? () => removeRange(i) : undefined}
            />
          ))}
          <AddTimeButton onPress={addRange} disabled={value.ranges.length >= MAX_RANGES} />
        </View>
      ) : null}
    </View>
  );
}
