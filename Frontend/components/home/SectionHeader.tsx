import { View, Text, Pressable } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export type SectionHeaderProps = {
  title: string;
  onSeeAll?: () => void;
};

/** "Recommended for You   See all" row — reused above every home section. */
export function SectionHeader({ title, onSeeAll }: SectionHeaderProps) {
  const { palette } = useThemeColors();

  return (
    <View className="flex-row items-center justify-between mt-6 mb-3">
      <Text className="text-[17px] font-semibold" style={{ color: palette.textPrimary }}>
        {title}
      </Text>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} hitSlop={8} accessibilityRole="link">
          <Text className="text-sm" style={{ color: palette.accent }}>
            See all
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
