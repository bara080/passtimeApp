import type { PropsWithChildren } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export type AuthScreenProps = PropsWithChildren<{
  /** Show the back arrow in the header. Default true. */
  showBack?: boolean;
  /** Override the default router.back() behavior. */
  onBack?: () => void;
  /** Wrap content in a ScrollView. Default true. */
  scroll?: boolean;
}>;

/** Base layout for all auth-flow screens: safe area, 21px gutters, back arrow header. */
export function AuthScreen({ children, showBack = true, onBack, scroll = true }: AuthScreenProps) {
  const router = useRouter();
  const { palette } = useThemeColors();

  const body = (
    <View className="flex-1 px-[21px] pb-8">
      {showBack ? (
        <Pressable
          onPress={onBack ?? (() => router.back())}
          className="mt-6 mb-6 w-8"
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={palette.textPrimary} />
        </Pressable>
      ) : (
        <View className="mt-6 mb-6 h-6" />
      )}
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      {scroll ? (
        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}
