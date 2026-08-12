import { View, Text, ScrollView, Pressable, ActivityIndicator, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CreditCard, Copy, Share2 } from "lucide-react-native";
import { BackButton } from "@/components/ui/BackButton";
import { statusColor } from "@/components/transactions";
import { experienceMeta } from "@/components/onboarding/experienceTypes.data";
import { useTransaction } from "@/services/payments/hooks";
import { formatMoney } from "@/utils/bookingMoney";
import { formatTxDate } from "@/components/transactions/transactionStatus";
import { useThemeColors } from "@/hooks/useThemeColors";

function hoursLabel(minutes: number | null): string {
  if (!minutes) return "";
  const h = minutes / 60;
  return Number.isInteger(h) ? `${h} h` : `${h.toFixed(1)} h`;
}

/** Transaction detail (Figma 1288:17205): headline amount, counterparty, IDs, and
 *  a fee breakdown. Backed by GET /api/payments/:paymentId. */
export default function TransactionDetailScreen() {
  const router = useRouter();
  const { palette } = useThemeColors();
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();
  const tx = useTransaction(paymentId ?? null);

  if (tx.isPending) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d] items-center justify-center">
        <ActivityIndicator color={palette.accent} />
      </SafeAreaView>
    );
  }
  if (tx.isError || !tx.data) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
        <View className="px-[21px] pt-4">
          <BackButton onPress={() => router.back()} />
          <Text className="text-sm text-red-500 mt-6">This transaction is unavailable.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const t = tx.data;
  const color = statusColor(t.status);
  const meta = experienceMeta(t.category);
  const isHost = t.role === "host";

  // Headline: host sees their net payout, member sees the total they paid.
  const headline = isHost ? t.amount : t.total;
  // Breakdown that always sums: base − fee = headline.
  //  · host  → base = gross charged, fee = platform cut, headline = net payout
  //  · member → base = subtotal,     fee = service+tax,  headline = total paid
  const base = isHost ? t.gross : t.subtotal ?? t.total;
  const feeAmount = Math.max(0, base - headline);
  const baseLabel = isHost ? "Amount paid" : "Subtotal";
  const feeLabel = isHost ? "Platform fee" : "Fees & taxes";
  const headlineLabel = isHost ? "Net payout" : "Total";

  const shareReceipt = () =>
    Share.share({
      message:
        `Passtime ${meta.label} — ${formatMoney(headline, t.currency)} (${t.statusLabel})\n` +
        (t.bookingId ? `Booking #${t.bookingId}\n` : "") +
        (t.transactionId ? `Transaction #${t.transactionId}` : ""),
    }).catch(() => {});

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="px-[21px] pt-4 flex-row items-center justify-between">
          <BackButton onPress={() => router.back()} />
          <Pressable onPress={shareReceipt} hitSlop={8} accessibilityLabel="Share receipt">
            <Share2 size={22} color={palette.textPrimary} />
          </Pressable>
        </View>

        {/* Headline */}
        <View className="items-center mt-6 px-[21px]">
          <View className="w-16 h-16 rounded-full items-center justify-center mb-5" style={{ backgroundColor: color }}>
            <CreditCard size={28} color="#ffffff" />
          </View>
          <Text className="text-[40px] font-bold" style={{ color: palette.textPrimary }}>
            {formatMoney(headline, t.currency)}
          </Text>
          <Text className="text-[15px] mt-2" style={{ color: palette.textPrimary }}>
            {isHost ? "Paid by" : "Paid to"}: <Text style={{ fontWeight: "600" }}>{t.counterpartyName}</Text>
          </Text>
          <Text className="text-[13px] mt-1" style={{ color: palette.textMuted }}>
            {formatTxDate(t.createdAt)}
          </Text>
          <Text className="text-[13px] mt-2" style={{ color: palette.textMuted }}>
            Status: <Text style={{ color, fontWeight: "700" }}>{t.statusLabel}</Text>
          </Text>
        </View>

        {/* IDs */}
        <View className="px-[21px] mt-6 gap-2">
          {t.bookingId ? <IdRow label="Booking Id" value={`#${t.bookingId}`} palette={palette} /> : null}
          {t.transactionId ? (
            <IdRow
              label="Transaction Id"
              value={`#${t.transactionId}`}
              palette={palette}
              onCopy={() => Share.share({ message: t.transactionId! }).catch(() => {})}
            />
          ) : null}
        </View>

        {/* Summary */}
        {t.subtotal != null ? (
          <View
            className="mx-[21px] mt-6 rounded-[16px] p-4"
            style={{ backgroundColor: palette.surfaceAlt, borderWidth: 1, borderColor: palette.border }}
          >
            <Text className="text-[16px] font-semibold mb-3" style={{ color: palette.textPrimary }}>
              Summary
            </Text>

            <Row
              label={`${meta.label}${t.durationMinutes ? `  ×  ${hoursLabel(t.durationMinutes)}` : ""}`}
              value={t.hourlyRate != null ? formatMoney(t.hourlyRate, t.currency) : "—"}
              palette={palette}
            />
            <Divider color={palette.border} />
            <Row label={baseLabel} value={formatMoney(base, t.currency)} palette={palette} />
            <Row label={feeLabel} value={`- ${formatMoney(feeAmount, t.currency)}`} palette={palette} valueColor="#f4511e" />
            <Divider color={palette.border} />
            <Row label={headlineLabel} value={formatMoney(headline, t.currency)} palette={palette} bold />
          </View>
        ) : null}

        <Pressable onPress={shareReceipt} className="items-center mt-6">
          <Text className="text-[14px] font-medium" style={{ color: palette.accent }}>
            Need Help?
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

type Pal = { textPrimary: string; textMuted: string; accent: string; border: string; surfaceAlt: string };

function IdRow({ label, value, palette, onCopy }: { label: string; value: string; palette: Pal; onCopy?: () => void }) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      <Text className="text-[13px]" style={{ color: palette.textMuted }}>
        {label}: <Text style={{ color: palette.textPrimary }}>{value}</Text>
      </Text>
      {onCopy ? (
        <Pressable onPress={onCopy} hitSlop={8} accessibilityLabel={`Copy ${label}`}>
          <Copy size={14} color={palette.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

function Row({
  label,
  value,
  palette,
  bold,
  valueColor,
}: {
  label: string;
  value: string;
  palette: Pal;
  bold?: boolean;
  valueColor?: string;
}) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text
        className={`text-[14px] ${bold ? "font-bold" : ""}`}
        style={{ color: palette.textPrimary }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        className={`text-[14px] ${bold ? "font-bold" : "font-medium"}`}
        style={{ color: valueColor ?? palette.textPrimary }}
      >
        {value}
      </Text>
    </View>
  );
}

function Divider({ color }: { color: string }) {
  return <View className="h-[1px] my-1" style={{ backgroundColor: color, opacity: 0.5 }} />;
}
