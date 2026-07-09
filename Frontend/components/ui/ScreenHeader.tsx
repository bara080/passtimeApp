import { View, Text } from "react-native";
import { BackButton } from "./BackButton";

export type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
};

/** Onboarding page header: back arrow, 26px title, optional subtitle. */
export function ScreenHeader({ title, subtitle, showBack = true, onBack }: ScreenHeaderProps) {
  return (
    <View className="mb-6">
      {showBack ? (
        <View className="mt-6 mb-6">
          <BackButton onPress={onBack} />
        </View>
      ) : (
        <View className="mt-6 mb-6 h-6" />
      )}
      <Text className="text-[26px] text-black dark:text-white">{title}</Text>
      {subtitle ? (
        <Text className="text-base text-black dark:text-[#d4d4d4] mt-2">{subtitle}</Text>
      ) : null}
    </View>
  );
}
