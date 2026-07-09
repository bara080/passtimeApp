import { View, Text } from "react-native";

export type AuthTitleProps = {
  title: string;
  subtitle?: string;
  description?: string;
};

/** Screen heading block: 26px title with optional subtitle and description. */
export function AuthTitle({ title, subtitle, description }: AuthTitleProps) {
  return (
    <View className="mb-6">
      <Text className="text-[26px] text-black dark:text-white">{title}</Text>
      {subtitle ? <Text className="text-base text-black dark:text-[#d4d4d4] mt-2">{subtitle}</Text> : null}
      {description ? <Text className="text-base text-black dark:text-[#d4d4d4] mt-3 leading-[22px]">{description}</Text> : null}
    </View>
  );
}
