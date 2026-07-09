import { View, Text } from "react-native";
import type { ReactNode } from "react";
import { useThemeColors } from "@/hooks/useThemeColors";

export type ProfileSectionProps = {
  title: string;
  children: ReactNode;
};

/** Section header + rounded card container that groups ProfileRow instances. */
export function ProfileSection({ title, children }: ProfileSectionProps) {
  const { palette, isDark } = useThemeColors();
  return (
    <View className="mb-5">
      <Text className="text-[13px] font-semibold mb-2 ml-1" style={{ color: palette.textMuted }}>
        {title}
      </Text>
      <View
        className="rounded-[14px] overflow-hidden border"
        style={{
          backgroundColor: isDark ? palette.surface : "#ffffff",
          borderColor: palette.border,
        }}
      >
        {children}
      </View>
    </View>
  );
}
