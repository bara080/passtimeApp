import { Text, Pressable } from "react-native";
import { Plus } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export type AddTimeButtonProps = {
  onPress: () => void;
  disabled?: boolean;
};

/** "+ Add time range" text button under a day's ranges. */
export function AddTimeButton({ onPress, disabled }: AddTimeButtonProps) {
  const { palette } = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="flex-row items-center gap-1 mt-2 self-start"
      style={{ opacity: disabled ? 0.4 : 1 }}
      accessibilityRole="button"
      accessibilityLabel="Add time range"
    >
      <Plus size={16} color={palette.accent} />
      <Text className="text-sm font-medium" style={{ color: palette.accent }}>
        Add time range
      </Text>
    </Pressable>
  );
}
