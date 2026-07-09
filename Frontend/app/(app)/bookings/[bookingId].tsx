import { useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { Calendar, Clock, MapPin, User, HelpCircle } from "lucide-react-native";
import { ScreenHeader, AppButton } from "@/components/ui";
import { SummaryLineItem } from "@/components/booking";
import { StatusPill, ReasonSheet } from "@/components/bookings";
import {
  useBookingDetails,
  useAcceptBooking,
  useDeclineBooking,
  useCancelBooking,
  usePayBooking,
} from "@/services/bookings/hooks";
import { useCreateChat } from "@/services/chat/hooks";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useToast } from "@/context/ToastProvider";
import { formatMoney } from "@/utils/bookingMoney";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short", year: "2-digit" });
}
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
function humanDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h} hours`;
}

/** Status-driven Request Details screen. Layout stays constant; the action bar
 *  and headline chip change with `booking.status` (Figma 1288:9916, 9974, 10036,
 *  10095, 10217). */
export default function BookingDetailsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { palette } = useThemeColors();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const details = useBookingDetails(bookingId ?? null);
  const accept = useAcceptBooking();
  const decline = useDeclineBooking();
  const cancel = useCancelBooking();
  const pay = usePayBooking();
  const createChat = useCreateChat();

  const [declineOpen, setDeclineOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (details.isPending) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d] items-center justify-center">
        <ActivityIndicator color={palette.accent} />
      </SafeAreaView>
    );
  }
  if (details.isError || !details.data) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
        <ScreenHeader title="Booking" />
        <View className="px-[21px]">
          <Text className="text-sm text-red-500">This booking is unavailable.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { booking, viewerRole } = details.data;
  const other = viewerRole === "member" ? booking.hostSnapshot : booking.memberSnapshot;
  const paid = booking.status === "confirmed" || booking.status === "active" || booking.status === "completed";
  const paymentLabel = paid ? "Paid" : "Unpaid";

  const guarded = (fn: () => Promise<unknown>, successMessage: string) => async () => {
    try {
      await fn();
      toast.success(successMessage);
    } catch (err) {
      toast.error("Could not update", err instanceof Error ? err.message : "Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <View className="flex-1 px-[21px] pb-6">
        <ScreenHeader title="Request details" />
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 30 }}>
          {/* Header — counterparty + status */}
          <View className="flex-row items-center gap-3 mb-2">
            {other.photoUrl ? (
              <Image source={{ uri: other.photoUrl }} className="w-14 h-14 rounded-full" />
            ) : (
              <View className="w-14 h-14 rounded-full items-center justify-center bg-[#f0f0f0] dark:bg-[#1a1a1a]">
                <User size={28} color={palette.textMuted} />
              </View>
            )}
            <View className="flex-1">
              <Text className="text-lg font-semibold" style={{ color: palette.textPrimary }}>
                {other.displayName}
              </Text>
              {viewerRole === "member" && booking.hostSnapshot.professionalRole ? (
                <Text className="text-xs" style={{ color: palette.textMuted }}>
                  {booking.hostSnapshot.professionalRole}
                </Text>
              ) : null}
            </View>
            <StatusPill status={booking.status} />
          </View>

          <View className="flex-row items-start gap-2 mb-4">
            <MapPin size={14} color={palette.textMuted} style={{ marginTop: 3 }} />
            <View className="flex-1">
              <Text className="text-sm" style={{ color: palette.textPrimary }}>
                {booking.venue.name}
              </Text>
              <Text className="text-xs" style={{ color: palette.textMuted }}>
                {booking.venue.address}
              </Text>
            </View>
          </View>

          {/* Chip grid: date, time, duration, category */}
          <View className="flex-row gap-2 mb-2">
            <DetailChip Icon={Calendar} label={formatDate(booking.startAt)} />
            <DetailChip Icon={Clock} label={formatTime(booking.startAt)} />
          </View>
          <View className="flex-row gap-2 mb-6">
            <DetailChip Icon={Clock} label={humanDuration(booking.durationMinutes)} />
            {booking.category ? <DetailChip Icon={HelpCircle} label={booking.category.replace(/-/g, " ")} /> : null}
          </View>

          {/* Payment block */}
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-base font-semibold" style={{ color: palette.textPrimary }}>
              Payment
            </Text>
            <StatusPill status={paid ? "confirmed" : "pending"} labelOverride={paymentLabel} />
          </View>
          <View className="border-t mt-1 pt-1" style={{ borderColor: palette.border }}>
            <SummaryLineItem label="Hourly rate" value={formatMoney(booking.hourlyRateSnapshot)} />
            <SummaryLineItem label="Subtotal" value={formatMoney(booking.subtotal)} />
            <SummaryLineItem label="Fees" value={formatMoney(booking.serviceFee)} />
            <SummaryLineItem label="Taxes" value={formatMoney(booking.tax)} />
            {booking.discount > 0 ? (
              <SummaryLineItem label="Discount" value={`-${formatMoney(booking.discount)}`} />
            ) : null}
            <View className="border-t mt-1 pt-1" style={{ borderColor: palette.border }}>
              <SummaryLineItem label="Total" value={formatMoney(booking.total)} bold />
            </View>
          </View>

          {["confirmed", "active", "completed"].includes(booking.status) ? (
            <View className="mt-4">
              <AppButton
                label="Open chat"
                variant="secondary"
                loading={createChat.isPending}
                onPress={async () => {
                  try {
                    const res = await createChat.mutateAsync(booking.bookingId);
                    router.push({ pathname: "/(app)/chat/[chatId]", params: { chatId: res.chat.chatId } } as unknown as Href);
                  } catch (err) {
                    toast.error("Could not open chat", err instanceof Error ? err.message : "Please try again.");
                  }
                }}
              />
            </View>
          ) : null}

          {booking.declineReason ? (
            <Text className="text-xs mt-4" style={{ color: palette.textMuted }}>
              Decline reason: {booking.declineReason}
            </Text>
          ) : null}
          {booking.cancelReason ? (
            <Text className="text-xs mt-4" style={{ color: palette.textMuted }}>
              Cancel reason: {booking.cancelReason}
            </Text>
          ) : null}
        </ScrollView>

        {/* Status-driven action bar */}
        <BookingActions
          status={booking.status}
          viewerRole={viewerRole}
          onAccept={guarded(() => accept.mutateAsync(booking.bookingId), "Booking accepted")}
          onOpenDecline={() => setDeclineOpen(true)}
          onOpenCancel={() => setCancelOpen(true)}
          onPay={guarded(async () => {
            const r = await pay.mutateAsync(booking.bookingId);
            // v1: Stripe checkout UI is deferred (see booking.md §5, needs
            // stripe-react-native card sheet). Surface the client_secret via
            // a toast so QA can complete payment in the dashboard.
            toast.info("Ready to pay", `Client secret: ${r.clientSecret.slice(0, 12)}…`);
          }, "Payment intent created")}
          busy={accept.isPending || decline.isPending || cancel.isPending || pay.isPending}
        />

        <ReasonSheet
          visible={declineOpen}
          title="Decline this request?"
          subtitle="Let the member know briefly why you can't accept."
          submitLabel="Decline booking"
          reasonRequired
          submitting={decline.isPending}
          onClose={() => setDeclineOpen(false)}
          onSubmit={async (reason) => {
            try {
              await decline.mutateAsync({ bookingId: booking.bookingId, reason });
              toast.success("Booking declined");
              setDeclineOpen(false);
            } catch (err) {
              toast.error("Could not decline", err instanceof Error ? err.message : "Please try again.");
            }
          }}
        />

        <ReasonSheet
          visible={cancelOpen}
          title="Cancel this booking?"
          subtitle={paid ? "The member will be refunded automatically." : undefined}
          submitLabel="Cancel booking"
          submitting={cancel.isPending}
          onClose={() => setCancelOpen(false)}
          onSubmit={async (reason) => {
            try {
              await cancel.mutateAsync({ bookingId: booking.bookingId, reason: reason || undefined });
              toast.success("Booking cancelled");
              setCancelOpen(false);
              router.back();
            } catch (err) {
              toast.error("Could not cancel", err instanceof Error ? err.message : "Please try again.");
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
}

function DetailChip({ Icon, label }: { Icon: typeof Calendar; label: string }) {
  const { palette } = useThemeColors();
  return (
    <View
      className="flex-row items-center gap-2 rounded-[10px] px-3 py-2 flex-1 border"
      style={{ borderColor: palette.border }}
    >
      <Icon size={14} color={palette.textMuted} />
      <Text className="text-sm" style={{ color: palette.textPrimary }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

type ActionProps = {
  status: string;
  viewerRole: "member" | "host";
  onAccept: () => void;
  onOpenDecline: () => void;
  onOpenCancel: () => void;
  onPay: () => void;
  busy: boolean;
};

function BookingActions({ status, viewerRole, onAccept, onOpenDecline, onOpenCancel, onPay, busy }: ActionProps) {
  if (viewerRole === "host" && status === "pending") {
    return (
      <View className="flex-row gap-2 mt-4">
        <View className="flex-1">
          <AppButton label="Decline" onPress={onOpenDecline} variant="secondary" disabled={busy} />
        </View>
        <View className="flex-1">
          <AppButton label="Accept" onPress={onAccept} loading={busy} />
        </View>
      </View>
    );
  }
  if (viewerRole === "member" && status === "accepted") {
    return (
      <View className="flex-row gap-2 mt-4">
        <View className="flex-1">
          <AppButton label="Cancel" onPress={onOpenCancel} variant="secondary" disabled={busy} />
        </View>
        <View className="flex-1">
          <AppButton label="Pay now" onPress={onPay} loading={busy} />
        </View>
      </View>
    );
  }
  if (["pending", "accepted", "confirmed"].includes(status)) {
    // member-pending, host-accepted/confirmed → single Cancel option.
    return <AppButton label="Cancel booking" onPress={onOpenCancel} variant="secondary" disabled={busy} />;
  }
  return null;
}
