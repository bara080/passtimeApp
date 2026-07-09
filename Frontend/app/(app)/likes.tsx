import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Heart } from "lucide-react-native";
import { EmptyState } from "@/components/ui/EmptyState";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function LikesScreen() {
  const router = useRouter();
  const { palette } = useThemeColors();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <View className="px-[21px] pt-4">
        <Text className="text-[26px] font-semibold" style={{ color: palette.textPrimary }}>
          Likes
        </Text>
      </View>
      <EmptyState
        Icon={Heart}
        heading="No Likes Yet"
        body={"When you find hosts you like, tap the ♥ icon to save them here. You can easily book them later."}
        tip="Liking profiles helps us recommend better matches."
        ctaLabel="Explore Hosts"
        onCta={() => router.push("/(app)/explore")}
      />
    </SafeAreaView>
  );
}
