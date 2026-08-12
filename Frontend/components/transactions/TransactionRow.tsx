import { View, Text, Pressable } from "react-native";
import { CreditCard } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import { formatMoney } from "@/utils/bookingMoney";
import type { Transaction } from "@/services/payments/types";
import { statusColor, formatTxDate } from "./transactionStatus";

export type TransactionRowProps = {
  tx: Transaction;
  onPress: () => void;
};

/** Row on the Transactions history list (Figma 1288:17021): status-colored icon
 *  square, counterparty + timestamp, amount + status label. */
export function TransactionRow({ tx, onPress }: TransactionRowProps) {
  const { palette } = useThemeColors();
  const color = statusColor(tx.status);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Transaction with ${tx.counterpartyName}, ${tx.statusLabel}`}
      className="flex-row items-center gap-3 py-3"
    >
      <View className="w-11 h-11 rounded-[12px] items-center justify-center" style={{ backgroundColor: color }}>
        <CreditCard size={22} color="#ffffff" />
      </View>

      <View className="flex-1">
        <Text className="text-[15px] font-semibold" style={{ color: palette.textPrimary }} numberOfLines={1}>
          {tx.counterpartyName}
        </Text>
        <Text className="text-[12px] mt-0.5" style={{ color: palette.textMuted }}>
          {formatTxDate(tx.createdAt)}
        </Text>
      </View>

      <View className="items-end">
        <Text className="text-[15px] font-semibold" style={{ color: palette.textPrimary }}>
          {formatMoney(tx.amount, tx.currency)}
        </Text>
        <Text className="text-[12px] mt-0.5" style={{ color: palette.textMuted }}>
          Status: <Text style={{ color, fontWeight: "600" }}>{tx.statusLabel}</Text>
        </Text>
      </View>
    </Pressable>
  );
}
