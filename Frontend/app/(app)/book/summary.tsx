import { useState } from "react";
import { View, ScrollView, Text, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { Calendar, Clock, MapPin, User } from "lucide-react-native";
import { ScreenHeader, AppButton } from "@/components/ui";
import { SummaryLineItem, DurationStepper } from "@/components/booking";
import { useCreateBooking } from "@/services/bookings/hooks";
import { useDiscoverHosts } from "@/services/hosts/hooks";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useToast } from "@/context/ToastProvider";
import { previewBookingMoney, formatMoney } from "@/utils/bookingMoney";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short", year: "2-digit" });
}
function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** Booking summary (Figma 1288:9847): host card, chips (date/time/venue), duration, money block, CTA. */
export default function BookingSummaryScreen() {
  const router = useRouter();
  const toast = useToast();
  const { palette } = useThemeColors();
  const params = useLocalSearchParams<{
    hostUid: string;
    startAt: string;
    durationMinutes: string;
    venueName: string;
    venueAddress: string;
  }>();

  const initialHours = Math.max(1, Math.round(Number(params.durationMinutes || 60) / 60));
  const [hours, setHours] = useState(initialHours);

  // Pull the host card from the discover cache to pick up the rate for a live preview.
  // Server recomputes on submit — this is display-only.
  const recommended = useDiscoverHosts({ section: "recommended", limit: 20 });
  const host = recommended.data?.find((h) => h.uid === params.hostUid);
  const hourlyRateCents = host?.hourlyRate ?? 0;
  const money = previewBookingMoney(hourlyRateCents, hours * 60);

  const create = useCreateBooking();

  const submit = async () => {
    try {
      const res = await create.mutateAsync({
        hostUid: params.hostUid,
        startAt: params.startAt,
        durationMinutes: hours * 60,
        venue: { name: params.venueName, address: params.venueAddress },
      });
      toast.success("Request sent", `${host?.firstName || "The host"} will respond soon.`);
      router.replace({ pathname: "/(app)/bookings", params: { window: "upcoming", highlight: res.booking.bookingId } } as unknown as Href);
    } catch (err) {
      toast.error("Could not send request", err instanceof Error ? err.message : "Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <View className="flex-1 px-[21px] pb-8">
        <ScreenHeader title="Booking summary" />
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Host card */}
          <View className="flex-row items-center gap-3 mb-4">
            {host?.photoUrl ? (
              <Image source={{ uri: host.photoUrl }} className="w-11 h-11 rounded-full" />
            ) : (
              <View className="w-11 h-11 rounded-full items-center justify-center bg-[#f0f0f0] dark:bg-[#1a1a1a]">
                <User size={22} color={palette.textMuted} />
              </View>
            )}
            <View className="flex-1">
              <Text className="text-base font-semibold" style={{ color: palette.textPrimary }}>
                {host?.displayName ?? "Host"}
              </Text>
              {host?.experienceTypes?.[0] ? (
                <Text className="text-xs" style={{ color: palette.textMuted }}>
                  {host.experienceTypes[0].replace(/-/g, " ")}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Chips */}
          <View className="flex-row gap-2 mb-2">
            <SummaryChip Icon={Calendar} label={params.startAt ? formatDate(params.startAt) : "—"} />
            <SummaryChip Icon={Clock} label={params.startAt ? formatTime(params.startAt) : "—"} />
          </View>
          <View className="flex-row gap-2 mb-4">
            <SummaryChip Icon={MapPin} label={params.venueName || "Venue"} />
          </View>

          <DurationStepper value={hours} min={1} max={8} onChange={setHours} />

          <View className="border-t mt-2 pt-2" style={{ borderColor: palette.border }}>
            <SummaryLineItem label={`General Companionship × ${hours} h`} value={formatMoney(hourlyRateCents)} />
            <SummaryLineItem label="Subtotal" value={formatMoney(money.subtotal)} />
            <SummaryLineItem label="Fees" value={formatMoney(money.serviceFee)} />
            <SummaryLineItem label="Taxes" value={formatMoney(money.tax)} />
            <SummaryLineItem label="Promo code discounts" value="—" />
            <View className="border-t mt-1 pt-1" style={{ borderColor: palette.border }}>
              <SummaryLineItem label="Total" value={formatMoney(money.total)} bold />
            </View>
          </View>

          <Text className="text-xs text-center mt-6" style={{ color: palette.textMuted }}>
            By continuing, you confirm that you accept Passtime&apos;s payment terms and cancellation policies.
          </Text>
        </ScrollView>
        <AppButton
          label="Send a request"
          onPress={submit}
          loading={create.isPending}
          disabled={!host || !params.startAt || !params.venueName}
        />
      </View>
    </SafeAreaView>
  );
}

function SummaryChip({ Icon, label }: { Icon: typeof Calendar; label: string }) {
  const { palette } = useThemeColors();
  return (
    <View
      className="flex-row items-center gap-2 rounded-[10px] px-3 py-2 flex-1 border"
      style={{ borderColor: palette.border }}
    >
      <Icon size={16} color={palette.textMuted} />
      <Text className="text-sm" style={{ color: palette.textPrimary }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
