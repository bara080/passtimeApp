import { View, Text } from "react-native";
import { BookingConfigRow, DURATION_OPTIONS, BUFFER_OPTIONS } from "./BookingConfigRow";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { BookingConfig } from "@/services/host/types";

export type BookingConfigSectionProps = {
  value: BookingConfig;
  onChange: (value: BookingConfig) => void;
};

/** Min / max booking duration + buffer between bookings. */
export function BookingConfigSection({ value, onChange }: BookingConfigSectionProps) {
  const { palette } = useThemeColors();

  return (
    <View className="mb-2">
      <Text className="text-base font-semibold mb-3" style={{ color: palette.textPrimary }}>
        Booking rules
      </Text>
      <BookingConfigRow
        label="Minimum booking duration"
        value={value.minMinutes}
        options={DURATION_OPTIONS}
        onChange={(minMinutes) => onChange({ ...value, minMinutes })}
      />
      <BookingConfigRow
        label="Maximum booking duration"
        value={value.maxMinutes}
        options={DURATION_OPTIONS}
        onChange={(maxMinutes) => onChange({ ...value, maxMinutes })}
      />
      <BookingConfigRow
        label="Buffer between bookings"
        value={value.bufferMinutes}
        options={BUFFER_OPTIONS}
        onChange={(bufferMinutes) => onChange({ ...value, bufferMinutes })}
      />
    </View>
  );
}
