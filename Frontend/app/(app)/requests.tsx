import { useMemo } from "react";
import { View, Text, SectionList, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import { CloudDownload } from "lucide-react-native";
import { RequestCard } from "@/components/requests";
import { useMyBookings } from "@/services/bookings/hooks";
import type { Booking } from "@/services/bookings/types";
import { useThemeColors } from "@/hooks/useThemeColors";

/** Day-bucket label: Today / Tomorrow / "Wed, 11 Mar". */
function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(d) - startOfDay(now)) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" });
}

type Section = { title: string; data: Booking[] };

/** Host Requests tab — pending booking requests grouped by day (Figma 1288:14959,
 *  empty state 1288:14933). Backed by GET /bookings/mine?window=upcoming, filtered
 *  to status "pending". */
export default function HostRequestsScreen() {
  const router = useRouter();
  const { palette } = useThemeColors();
  const upcoming = useMyBookings("upcoming");

  const pending = useMemo(
    () => (upcoming.data ?? []).filter((b) => b.status === "pending"),
    [upcoming.data]
  );

  const sections = useMemo<Section[]>(() => {
    const buckets = new Map<string, Booking[]>();
    for (const b of pending) {
      const key = dayLabel(b.startAt);
      const arr = buckets.get(key) ?? [];
      arr.push(b);
      buckets.set(key, arr);
    }
    return Array.from(buckets, ([title, data]) => ({ title, data }));
  }, [pending]);

  const openBooking = (bookingId: string) =>
    router.push({ pathname: "/(app)/bookings/[bookingId]", params: { bookingId } } as unknown as Href);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <View className="px-[21px] pt-4 pb-2">
        <Text className="text-[26px] font-semibold" style={{ color: palette.textPrimary }}>
          Requests
        </Text>
        {pending.length > 0 ? (
          <Text className="text-[14px] mt-1" style={{ color: palette.textMuted }}>
            You have <Text style={{ fontWeight: "700", color: palette.textPrimary }}>{pending.length}</Text> new
            booking request{pending.length === 1 ? "" : "s"}.
          </Text>
        ) : null}
      </View>

      {upcoming.isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={palette.accent} />
        </View>
      ) : pending.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <CloudDownload size={56} color={palette.accent} strokeWidth={1.4} />
          <Text className="text-[22px] font-semibold mt-6 mb-2" style={{ color: palette.accent }}>
            No new requests.
          </Text>
          <Text className="text-[15px] text-center leading-[22px]" style={{ color: palette.textMuted }}>
            You don't have any new requests available at the moment.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.bookingId}
          contentContainerStyle={{ paddingHorizontal: 21, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={upcoming.isRefetching}
              onRefresh={() => upcoming.refetch()}
              tintColor={palette.accent}
            />
          }
          renderSectionHeader={({ section }) => (
            <Text className="text-[16px] font-semibold mt-3 mb-3" style={{ color: palette.textPrimary }}>
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => (
            <RequestCard booking={item} onPress={() => openBooking(item.bookingId)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}
