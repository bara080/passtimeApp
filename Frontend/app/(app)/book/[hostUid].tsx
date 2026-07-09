import { useEffect, useMemo, useState } from "react";
import { View, ScrollView, ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { ScreenHeader } from "@/components/ui";
import { DateRail, SlotRow } from "@/components/booking";
import { useSlots } from "@/services/bookings/hooks";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useToast } from "@/context/ToastProvider";
import { trackEvent } from "@/utils/analytics";
import type { Slot } from "@/services/bookings/types";

const DAYS_IN_RAIL = 14;

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default function BookingCalendarScreen() {
  const router = useRouter();
  const toast = useToast();
  const { hostUid, hostName } = useLocalSearchParams<{ hostUid: string; hostName?: string }>();
  const { palette } = useThemeColors();

  const dates = useMemo(() => Array.from({ length: DAYS_IN_RAIL }, (_, i) => isoDate(i)), []);
  const [date, setDate] = useState<string>(dates[0]);

  const slots = useSlots(hostUid ?? null, date);

  useEffect(() => {
    trackEvent("booking.calendar.viewed", { hostUid: hostUid ?? "" });
  }, [hostUid]);

  const pickSlot = (slot: Slot) => {
    trackEvent("booking.slot.selected", { hostUid: hostUid ?? "", date, start: slot.start });
    const startAt = new Date(`${date}T${slot.start}:00`).toISOString();
    const [h, m] = slot.end.split(":").map(Number);
    const [sh, sm] = slot.start.split(":").map(Number);
    const durationMinutes = h * 60 + m - (sh * 60 + sm);
    router.push({
      pathname: "/(app)/book/venue",
      params: { hostUid: hostUid ?? "", startAt, durationMinutes: String(durationMinutes) },
    } as unknown as Href);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <View className="flex-1 px-[21px]">
        <ScreenHeader title={hostName ? `Book ${hostName}` : "Book host"} />
        <DateRail dates={dates} value={date} onChange={setDate} />
        {slots.data ? (
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-semibold" style={{ color: palette.textPrimary }}>
              {new Date(date).toDateString()}
            </Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-sm" style={{ color: palette.textMuted }}>
                Available:
              </Text>
              <View className="rounded-full px-3 py-1" style={{ backgroundColor: "#7cb342" }}>
                <Text className="text-xs font-semibold text-white">{slots.data.availableCount} Slots</Text>
              </View>
            </View>
          </View>
        ) : null}
        <Text className="text-xs mb-3" style={{ color: palette.accent }}>
          Note: Minimum booking slot is an hour
        </Text>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {slots.isPending ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={palette.accent} />
          ) : slots.isError ? (
            <Text className="text-sm text-red-500 mt-6">
              Could not load slots. Pull to try again.
            </Text>
          ) : (
            slots.data?.slots.map((s) => <SlotRow key={s.start} slot={s} onPress={pickSlot} />)
          )}
          {slots.data && slots.data.slots.length === 0 ? (
            <Text className="text-sm mt-6" style={{ color: palette.textMuted }}>
              No slots this day. Try another date.
            </Text>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
