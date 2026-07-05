import { View, Text, Pressable, Alert } from "react-native";
import { SvgXml } from "react-native-svg";
import { GOOGLE_LOGO_SVG, APPLE_LOGO_SVG } from "./socialLogos";

export type SocialAuthRowProps = {
  /** Verb shown in the divider text, e.g. "Sign up" or "Login". */
  context?: string;
};

/** Google/Apple auth buttons. Social login backend does not exist yet — buttons alert. */
export function SocialAuthRow({ context = "Sign up" }: SocialAuthRowProps) {
  const notAvailable = () => Alert.alert("Coming soon", "Social login is not available yet.");

  return (
    <View className="items-center mt-6">
      <Text className="text-base text-[#1a1a1a] mb-4">Or {context} using with...</Text>
      <View className="flex-row gap-[10px]">
        <SocialButton label="Google" svg={GOOGLE_LOGO_SVG} onPress={notAvailable} />
        <SocialButton label="Apple" svg={APPLE_LOGO_SVG} onPress={notAvailable} />
      </View>
    </View>
  );
}

function SocialButton({ label, svg, onPress }: { label: string; svg: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="h-[52px] flex-1 max-w-[170px] bg-[#1a1a1a] rounded-[8px] flex-row items-center justify-center gap-3"
      accessibilityRole="button"
      accessibilityLabel={`Continue with ${label}`}
    >
      <SvgXml xml={svg} width={24} height={24} />
      <Text className="text-white text-base">{label}</Text>
    </Pressable>
  );
}
