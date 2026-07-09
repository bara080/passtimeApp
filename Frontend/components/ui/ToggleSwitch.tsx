import { Switch } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export type ToggleSwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

/** Themed on/off switch — accent track when on. */
export function ToggleSwitch({ value, onValueChange, disabled }: ToggleSwitchProps) {
  const { palette, isDark } = useThemeColors();

  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: isDark ? "#333333" : "#d1d5dc", true: palette.accent }}
      thumbColor="#ffffff"
      accessibilityRole="switch"
    />
  );
}
