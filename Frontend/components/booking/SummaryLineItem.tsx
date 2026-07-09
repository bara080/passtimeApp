import { View, Text } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export type SummaryLineItemProps = {
  label: string;
  value: string;
  bold?: boolean;
};

/** One row of the money block on the booking summary (Figma 1288:9847). */
export function SummaryLineItem({ label, value, bold }: SummaryLineItemProps) {
  const { palette } = useThemeColors();
  const weight = bold ? "600" : "400";

  return (
    <View className="flex-row justify-between items-center py-2">
      <Text className="text-[15px]" style={{ color: palette.textPrimary, fontWeight: weight }}>
        {label}
      </Text>
      <Text className="text-[15px]" style={{ color: palette.textPrimary, fontWeight: weight }}>
        {value}
      </Text>
    </View>
  );
}
