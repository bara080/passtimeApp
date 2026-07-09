import { View, Text, Pressable, Alert, ActivityIndicator, Platform } from "react-native";
import { SvgXml } from "react-native-svg";
import { googleLogoSvg, appleLogoSvg } from "./socialLogos";
import { useThemeColors } from "@/hooks/useThemeColors";

export type SocialAuthRowProps = {
  /** Verb shown in the divider text, e.g. "Sign up" or "Login". */
  context?: string;
  onGoogle?: () => void;
  /** iOS only — the Apple button is hidden on Android. */
  onApple?: () => void;
  /** Which provider is mid-flight (disables both buttons, spinner on the active one). */
  pending?: "google" | "apple" | null;
};

/** Google/Apple auth buttons. Falls back to a "coming soon" alert when handlers are absent. */
export function SocialAuthRow({ context = "Sign up", onGoogle, onApple, pending = null }: SocialAuthRowProps) {
  const notAvailable = () => Alert.alert("Coming soon", "Social login is not available yet.");
  const showApple = Platform.OS === "ios";
  const { palette } = useThemeColors();

  return (
    <View className="items-center mt-6">
      <Text className="text-base text-[#1a1a1a] dark:text-white mb-4">Or {context} using with...</Text>
      <View className="flex-row gap-[10px]">
        <SocialButton
          label="Google"
          svg={googleLogoSvg(palette.contrastText)}
          onPress={onGoogle ?? notAvailable}
          busy={pending === "google"}
          disabled={pending !== null}
        />
        {showApple ? (
          <SocialButton
            label="Apple"
            svg={appleLogoSvg(palette.contrastText)}
            onPress={onApple ?? notAvailable}
            busy={pending === "apple"}
            disabled={pending !== null}
          />
        ) : null}
      </View>
    </View>
  );
}

function SocialButton({
  label,
  svg,
  onPress,
  busy,
  disabled,
}: {
  label: string;
  svg: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  const { palette } = useThemeColors();
  const spinnerColor = palette.contrastText;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="h-[52px] flex-1 max-w-[170px] bg-[#1a1a1a] dark:bg-[#f4f4f5] rounded-[8px] flex-row items-center justify-center gap-3"
      style={{ opacity: disabled && !busy ? 0.6 : 1 }}
      accessibilityRole="button"
      accessibilityLabel={`Continue with ${label}`}
    >
      {busy ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <>
          <SvgXml xml={svg} width={24} height={24} />
          <Text className="text-white dark:text-[#1a1a1a] text-base">{label}</Text>
        </>
      )}
    </Pressable>
  );
}
