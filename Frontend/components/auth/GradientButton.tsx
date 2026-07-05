import { Text, Pressable, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { authGradient, radii } from "@/constants/theme";

export type GradientButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

/** Primary CTA: orange gradient, 52px height, white 18px label. */
export function GradientButton({ label, onPress, loading, disabled }: GradientButtonProps) {
  return (
    <LinearGradient
      colors={[...authGradient]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ borderRadius: radii.button, opacity: disabled ? 0.6 : 1 }}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        className="h-[52px] items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-[18px]">{label}</Text>}
      </Pressable>
    </LinearGradient>
  );
}
