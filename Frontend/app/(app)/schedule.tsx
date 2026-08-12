import { useMemo, useState } from "react";
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import { DateRail } from "@/components/booking/DateRail";
import { ScheduleCard } from "@/components/schedule";
import { useMyBookings } from "@/services/bookings/hooks";
import type { Booking } from "@/services/bookings/types";
import { useThemeColors } from "@/hooks/useThemeColors";

const DAYS_AHEAD = 14;

/** Local YYYY-MM-DD for a Date. */
function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function hourLabel(h: number): string {
  const period = h < 12 ? "AM" : "PM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${String(display).padStart(2, "0")} ${period}`;
}
function longDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" });
}

/** Host Schedule tab — date rail + hourly timeline of booked slots for the
 *  selected day (Figma 1288:12871). Backed by GET /bookings/mine (upcoming +
 *  current), showing accepted / confirmed / active bookings. */
export default function HostScheduleScreen() {
  const router = useRouter();
  const { palette } = useThemeColors();

  const upcoming = useMyBookings("upcoming");
  const current = useMyBookings("current");

  const dates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: DAYS_AHEAD }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return toISODate(d);
    });
  }, []);
  const [selected, setSelected] = useState(dates[0]);

  // Scheduled = accepted/confirmed/active, deduped across the two windows.
  const scheduled = useMemo(() => {
    const byId = new Map<string, Booking>();
    for (const b of [...(upcoming.data ?? []), ...(current.data ?? [])]) {
      if (["accepted", "confirmed", "active"].includes(b.status)) byId.set(b.bookingId, b);
    }
    return Array.from(byId.values());
  }, [upcoming.data, current.data]);

  const dayBookings = useMemo(
    () =>
      scheduled
        .filter((b) => toISODate(new Date(b.startAt)) === selected)
        .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt)),
    [scheduled, selected]
  );

  // Hour rows spanning the first→last booking of the day (min 9AM–6PM window).
  const hours = useMemo(() => {
    if (dayBookings.length === 0) return [] as number[];
    const startHours = dayBookings.map((b) => new Date(b.startAt).getHours());
    const lo = Math.min(9, ...startHours);
    const hi = Math.max(18, ...startHours);
    return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  }, [dayBookings]);

  const bookingAtHour = (h: number) => dayBookings.find((b) => new Date(b.startAt).getHours() === h);
  const openBooking = (bookingId: string) =>
    router.push({ pathname: "/(app)/bookings/[bookingId]", params: { bookingId } } as unknown as Href);

  const loading = upcoming.isPending || current.isPending;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <View className="px-[21px] pt-4 pb-2">
        <Text className="text-[26px] font-semibold mb-3" style={{ color: palette.textPrimary }}>
          Schedule
        </Text>
        <DateRail dates={dates} value={selected} onChange={setSelected} />
        <View className="flex-row items-center justify-between mt-1">
          <Text className="text-[16px] font-semibold" style={{ color: palette.textPrimary }}>
            {selected === dates[0] ? "Today" : longDay(selected)}
          </Text>
          <Text className="text-[13px]" style={{ color: palette.textMuted }}>
            {dayBookings.length} booking{dayBookings.length === 1 ? "" : "s"}
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={palette.accent} />
        </View>
      ) : dayBookings.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <Text className="text-[15px] text-center leading-[22px]" style={{ color: palette.textMuted }}>
            No bookings on this day. Accepted bookings will appear here on their scheduled date.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 21, paddingBottom: 120, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={upcoming.isRefetching || current.isRefetching}
              onRefresh={() => {
                upcoming.refetch();
                current.refetch();
              }}
              tintColor={palette.accent}
            />
          }
        >
          {hours.map((h) => {
            const b = bookingAtHour(h);
            return (
              <View key={h} className="flex-row items-stretch min-h-[52px]">
                <View className="w-[56px] pt-1">
                  <Text className="text-[12px]" style={{ color: palette.textMuted }}>
                    {hourLabel(h)}
                  </Text>
                </View>
                <View className="flex-1 pb-2">
                  {b ? (
                    <ScheduleCard booking={b} onPress={() => openBooking(b.bookingId)} />
                  ) : (
                    <View className="h-[1px] mt-3" style={{ backgroundColor: palette.border }} />
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
