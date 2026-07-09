import { View, ScrollView, ActivityIndicator, Text, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import { useAuth } from "@/context/AuthProvider";
import { useHostDashboard } from "@/services/hostDashboard/hooks";
import { useMyBookings } from "@/services/bookings/hooks";
import { useCreateChat } from "@/services/chat/hooks";
import { useToast } from "@/context/ToastProvider";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  DashboardHeader,
  VerificationAlerts,
  PendingRequestsChip,
  EarningsTiles,
  RevenueTrendChart,
  PerformanceStats,
  PerformanceTrendChart,
  AvailabilityStrip,
} from "@/components/dashboard";
import { UpcomingBookingCard } from "@/components/home";

/** Host dashboard — Figma 1288:12106. Single screen renders v1/v2/v3 sections
 *  conditionally based on real data (see hostDashboardDesign.md). */
export default function HostDashboardScreen() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { palette } = useThemeColors();

  const dashboard = useHostDashboard(Boolean(user && user.role === "host"));
  const upcoming = useMyBookings("upcoming");
  const current = useMyBookings("current");
  const createChat = useCreateChat();

  const nextUpcoming = upcoming.data?.[0];
  const activeBooking = current.data?.[0];

  const openChat = async (bookingId: string) => {
    try {
      const res = await createChat.mutateAsync(bookingId);
      router.push({ pathname: "/(app)/chat/[chatId]", params: { chatId: res.chat.chatId } } as unknown as Href);
    } catch (err) {
      toast.error("Could not open chat", err instanceof Error ? err.message : "Please try again.");
    }
  };

  const refreshing = dashboard.isRefetching || upcoming.isRefetching || current.isRefetching;
  const onRefresh = () => {
    dashboard.refetch();
    upcoming.refetch();
    current.refetch();
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <ScrollView
        className="flex-1 px-[21px] pt-2"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff6633" />}
      >
        <DashboardHeader
          addressLine={user?.firstName ? "Set your address" : null}
          avatarUrl={user?.avatarUrl}
          onPressBell={() => router.push("/(app)/notifications" as unknown as Href)}
          onPressAvatar={() => router.push("/(app)/profile")}
        />

        {dashboard.isPending ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={palette.accent} />
        ) : dashboard.isError || !dashboard.data ? (
          <Text className="text-sm text-red-500 mt-6">Could not load dashboard.</Text>
        ) : (
          <>
            {/* v1 — verification alerts (only render what's incomplete) */}
            <VerificationAlerts verification={dashboard.data.verification} />

            {/* v1/v2 — pending requests chip */}
            <PendingRequestsChip count={dashboard.data.pendingRequestCount} />

            {/* v3 — current active booking (green border) */}
            {activeBooking ? (
              <>
                <SectionHeader text="Current booking" />
                <UpcomingBookingCard
                  booking={activeBooking}
                  active
                  onView={() =>
                    router.push({
                      pathname: "/(app)/bookings/[bookingId]",
                      params: { bookingId: activeBooking.bookingId },
                    } as unknown as Href)
                  }
                  onChat={() => openChat(activeBooking.bookingId)}
                />
              </>
            ) : nextUpcoming ? (
              <>
                <SectionHeader text="Upcoming booking" />
                <UpcomingBookingCard
                  booking={nextUpcoming}
                  onView={() =>
                    router.push({
                      pathname: "/(app)/bookings/[bookingId]",
                      params: { bookingId: nextUpcoming.bookingId },
                    } as unknown as Href)
                  }
                  onChat={() => openChat(nextUpcoming.bookingId)}
                />
              </>
            ) : null}

            <View className="h-6" />

            <EarningsTiles earnings={dashboard.data.earnings} />
            <RevenueTrendChart trend={dashboard.data.revenueTrend} />
            <PerformanceStats performance={dashboard.data.performance} />
            <PerformanceTrendChart trend={dashboard.data.performanceTrend} />
            <AvailabilityStrip days={dashboard.data.availability.thisWeek} />
          </>
        )}

        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ text }: { text: string }) {
  const { palette } = useThemeColors();
  return (
    <Text className="text-[17px] font-semibold mt-3 mb-2" style={{ color: palette.textPrimary }}>
      {text}
    </Text>
  );
}
