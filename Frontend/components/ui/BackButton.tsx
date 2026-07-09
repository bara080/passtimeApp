import { Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export type BackButtonProps = {
  /** Override the default router.back(). */
  onPress?: () => void;
  size?: number;
};

/** Standalone back chevron, themed. */
export function BackButton({ onPress, size = 24 }: BackButtonProps) {
  const router = useRouter();
  const { palette } = useThemeColors();

  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      className="w-8"
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <ArrowLeft size={size} color={palette.textPrimary} />
    </Pressable>
  );
}
