import { Text, Pressable } from "react-native";
import { GradientButton } from "@/components/auth/GradientButton";
import { useThemeColors } from "@/hooks/useThemeColors";

export type AppButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** primary = orange gradient CTA; secondary = bordered neutral. */
  variant?: "primary" | "secondary";
};

/** General-purpose CTA. Primary delegates to the auth GradientButton for pixel parity. */
export function AppButton({ label, onPress, loading, disabled, variant = "primary" }: AppButtonProps) {
  const { palette } = useThemeColors();

  if (variant === "primary") {
    return <GradientButton label={label} onPress={onPress} loading={loading} disabled={disabled} />;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className="h-[52px] items-center justify-center rounded-[8px] border border-[#d1d5dc] dark:border-[#333333]"
      style={{ opacity: disabled ? 0.6 : 1 }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text className="text-[18px]" style={{ color: palette.textPrimary }}>
        {loading ? "..." : label}
      </Text>
    </Pressable>
  );
}
