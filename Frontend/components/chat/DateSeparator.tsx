import { View, Text } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export type DateSeparatorProps = { label: string };

/** Small centered date pill between message groups. */
export function DateSeparator({ label }: DateSeparatorProps) {
  const { palette } = useThemeColors();

  return (
    <View className="items-center my-3">
      <View className="px-3 py-1 rounded-full bg-[#f4f4f5] dark:bg-[#1a1a1a]">
        <Text className="text-[11px]" style={{ color: palette.textMuted }}>
          {label}
        </Text>
      </View>
    </View>
  );
}
