import { useState } from "react";
import { View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader, AppButton } from "@/components/ui";
import { WeeklyAvailabilitySection } from "./WeeklyAvailabilitySection";
import { BlockedDatesSection } from "./BlockedDatesSection";
import { BookingConfigSection } from "./BookingConfigSection";
import { useSaveHostAvailability } from "@/services/host/hooks";
import { useToast } from "@/context/ToastProvider";
import type { AvailabilityDoc, WeeklyDay } from "@/services/host/types";

// Mon–Fri 9–5 default gives hosts a realistic starting point to edit down.
const DEFAULT_WEEKLY: WeeklyDay[] = Array.from({ length: 7 }, (_, day) => ({
  day,
  enabled: day >= 1 && day <= 5,
  ranges: day >= 1 && day <= 5 ? [{ start: "09:00", end: "17:00" }] : [],
}));

const DEFAULT_DOC: AvailabilityDoc = {
  weekly: DEFAULT_WEEKLY,
  blockedDates: [],
  bookingConfig: { minMinutes: 60, maxMinutes: 240, bufferMinutes: 30 },
};

/** Page logic: weekly hours, blocked dates, booking rules → PUT /host/availability. */
export function AvailabilityScreen() {
  const router = useRouter();
  const toast = useToast();
  const save = useSaveHostAvailability();
  const [doc, setDoc] = useState<AvailabilityDoc>(DEFAULT_DOC);

  const hasEnabledDay = doc.weekly.some((d) => d.enabled && d.ranges.length > 0);

  const submit = async () => {
    try {
      await save.mutateAsync(doc);
      router.push("/(auth)/host/photos");
    } catch (err) {
      toast.error("Could not save", err instanceof Error ? err.message : "Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <View className="flex-1 px-[21px] pb-8">
        <ScreenHeader
          title="Your availability"
          subtitle="Set when members can book time with you."
        />
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <WeeklyAvailabilitySection
            value={doc.weekly}
            onChange={(weekly) => setDoc((d) => ({ ...d, weekly }))}
          />
          <BlockedDatesSection
            value={doc.blockedDates}
            onChange={(blockedDates) => setDoc((d) => ({ ...d, blockedDates }))}
          />
          <BookingConfigSection
            value={doc.bookingConfig}
            onChange={(bookingConfig) => setDoc((d) => ({ ...d, bookingConfig }))}
          />
        </ScrollView>
        <AppButton
          label="Continue"
          onPress={submit}
          loading={save.isPending}
          disabled={!hasEnabledDay}
        />
      </View>
    </SafeAreaView>
  );
}
