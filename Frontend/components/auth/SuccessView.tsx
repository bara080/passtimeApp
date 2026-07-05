import { View, Text } from "react-native";
import { Check } from "lucide-react-native";
import { colors } from "@/constants/theme";
import { GradientButton } from "./GradientButton";

export type SuccessViewProps = {
  title: string;
  message?: string;
  buttonLabel: string;
  onContinue: () => void;
};

/** Full-screen success state: green check badge, title, message, continue CTA. */
export function SuccessView({ title, message, buttonLabel, onContinue }: SuccessViewProps) {
  return (
    <View className="flex-1 justify-center pb-16">
      <View className="items-center mb-8">
        <View
          className="w-[88px] h-[88px] rounded-full items-center justify-center mb-6"
          style={{ backgroundColor: colors.success }}
        >
          <Check size={44} color="#fff" strokeWidth={3} />
        </View>
        <Text className="text-[26px] text-black text-center">{title}</Text>
        {message ? (
          <Text className="text-base text-[#444] text-center mt-3 leading-[22px]">{message}</Text>
        ) : null}
      </View>
      <GradientButton label={buttonLabel} onPress={onContinue} />
    </View>
  );
}
