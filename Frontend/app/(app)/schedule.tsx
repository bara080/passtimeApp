import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CalendarDays } from "lucide-react-native";
import { EmptyState } from "@/components/ui/EmptyState";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function HostScheduleScreen() {
  const router = useRouter();
  const { palette } = useThemeColors();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <View className="px-[21px] pt-4">
        <Text className="text-[26px] font-semibold" style={{ color: palette.textPrimary }}>
          Schedule
        </Text>
      </View>
      <EmptyState
        Icon={CalendarDays}
        heading="Coming soon"
        body="Weekly calendar with your accepted bookings will live here. Set your availability from Profile → Availability in the meantime."
        ctaLabel="Back to dashboard"
        onCta={() => router.replace("/(app)/dashboard" as unknown as never)}
      />
    </SafeAreaView>
  );
}
