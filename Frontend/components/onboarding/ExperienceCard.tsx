import { Text, Pressable } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export type ExperienceCardProps = {
  label: string;
  Icon: LucideIcon;
  selected: boolean;
  onPress: () => void;
};

/** Selectable grid card: icon over label; accent border + tint when selected. */
export function ExperienceCard({ label, Icon, selected, onPress }: ExperienceCardProps) {
  const { palette, isDark } = useThemeColors();
  const selectedTint = isDark ? "#33200f" : "#fff3ec";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      className="items-center justify-center rounded-[12px] border px-3 py-6 gap-3"
      style={{
        width: "48%",
        borderColor: selected ? palette.accent : palette.border,
        backgroundColor: selected ? selectedTint : palette.surface,
      }}
    >
      <Icon size={28} color={selected ? palette.accent : palette.textPrimary} strokeWidth={1.6} />
      <Text
        className="text-sm text-center"
        style={{ color: selected ? palette.accent : palette.textPrimary }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
