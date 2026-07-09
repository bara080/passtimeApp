import { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import { useAuth } from "@/context/AuthProvider";
import { useMyBookings } from "@/services/bookings/hooks";
import { BookingListRow } from "@/components/bookings";
import { useThemeColors } from "@/hooks/useThemeColors";
import { trackEvent } from "@/utils/analytics";
import type { BookingWindow } from "@/services/bookings/types";

const TABS: { key: BookingWindow; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "current", label: "Current" },
  { key: "past", label: "Past" },
];

export default function MyBookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { palette } = useThemeColors();
  const viewerRole: "member" | "host" = user?.role === "host" ? "host" : "member";
  const [tab, setTab] = useState<BookingWindow>("upcoming");

  const list = useMyBookings(tab);

  useEffect(() => {
    trackEvent("bookings.list.viewed", { window: tab, role: viewerRole });
  }, [tab, viewerRole]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <View className="px-[21px] pt-4">
        <Text className="text-[26px] font-semibold mb-4" style={{ color: palette.textPrimary }}>
          My bookings
        </Text>
        <View className="flex-row rounded-full p-1 mb-4 bg-[#f4f4f5] dark:bg-[#1a1a1a]">
          {TABS.map(({ key, label }) => {
            const active = tab === key;
            return (
              <Pressable
                key={key}
                onPress={() => setTab(key)}
                className={`flex-1 h-9 items-center justify-center rounded-full ${active ? "bg-white dark:bg-[#0d0d0d]" : ""}`}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text className="text-sm font-medium" style={{ color: active ? palette.accent : palette.textMuted }}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <ScrollView
        className="flex-1 px-[21px]"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={list.isRefetching} onRefresh={list.refetch} tintColor="#ff6633" />}
      >
        {list.isPending ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={palette.accent} />
        ) : list.isError ? (
          <Text className="text-sm text-red-500 mt-6">Could not load bookings.</Text>
        ) : list.data && list.data.length === 0 ? (
          <Text className="text-sm text-center mt-10" style={{ color: palette.textMuted }}>
            No {tab} bookings yet.
          </Text>
        ) : (
          list.data?.map((b) => (
            <BookingListRow
              key={b.bookingId}
              booking={b}
              viewerRole={viewerRole}
              onPress={() =>
                router.push({
                  pathname: "/(app)/bookings/[bookingId]",
                  params: { bookingId: b.bookingId },
                } as unknown as Href)
              }
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
