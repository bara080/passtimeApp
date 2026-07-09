import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Inbox } from "lucide-react-native";
import { EmptyState } from "@/components/ui/EmptyState";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function HostRequestsScreen() {
  const router = useRouter();
  const { palette } = useThemeColors();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <View className="px-[21px] pt-4">
        <Text className="text-[26px] font-semibold" style={{ color: palette.textPrimary }}>
          Requests
        </Text>
      </View>
      <EmptyState
        Icon={Inbox}
        heading="Coming soon"
        body="Pending booking requests will list here. For now they land on your dashboard as a chip and in My bookings."
        ctaLabel="Back to dashboard"
        onCta={() => router.replace("/(app)/dashboard" as unknown as never)}
      />
    </SafeAreaView>
  );
}
