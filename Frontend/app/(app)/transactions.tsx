import { useMemo, useState } from "react";
import { View, Text, TextInput, SectionList, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import { Search, X, Receipt } from "lucide-react-native";
import { BackButton } from "@/components/ui/BackButton";
import { TransactionRow } from "@/components/transactions";
import { useTransactions } from "@/services/payments/hooks";
import { formatMoney } from "@/utils/bookingMoney";
import type { Transaction } from "@/services/payments/types";
import { useThemeColors } from "@/hooks/useThemeColors";

/** Day-bucket label: "Today - 11 Mar" / "Yesterday - 10 Mar" / "Monday - 09 Mar". */
function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  const short = d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
  if (diffDays === 0) return `Today - ${short}`;
  if (diffDays === 1) return `Yesterday - ${short}`;
  return `${d.toLocaleDateString(undefined, { weekday: "long" })} - ${short}`;
}

type Section = { title: string; data: Transaction[] };

/** Transactions history (Figma 1288:17021). Member charges or host earnings from
 *  GET /api/payments, grouped by day, searchable by name or amount. */
export default function TransactionsScreen() {
  const router = useRouter();
  const { palette } = useThemeColors();
  const txs = useTransactions();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = txs.data ?? [];
    if (!q) return all;
    return all.filter(
      (t) =>
        t.counterpartyName.toLowerCase().includes(q) ||
        formatMoney(t.amount, t.currency).toLowerCase().includes(q)
    );
  }, [txs.data, query]);

  const sections = useMemo<Section[]>(() => {
    const buckets = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const key = dayLabel(t.createdAt);
      const arr = buckets.get(key) ?? [];
      arr.push(t);
      buckets.set(key, arr);
    }
    return Array.from(buckets, ([title, data]) => ({ title, data }));
  }, [filtered]);

  const openDetail = (paymentId: string) =>
    router.push({ pathname: "/(app)/transactions/[paymentId]", params: { paymentId } } as unknown as Href);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <View className="px-[21px] pt-4">
        <View className="flex-row items-center gap-3 mb-4">
          <BackButton onPress={() => router.back()} />
          <Text className="text-[22px] font-semibold" style={{ color: palette.textPrimary }}>
            Transactions history
          </Text>
        </View>

        <View className="flex-row items-center gap-3 h-12 rounded-full px-4 bg-[#f4f4f5] dark:bg-[#1a1a1a] border border-transparent dark:border-[#333333]">
          <Search size={18} color={palette.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or amount"
            placeholderTextColor={palette.placeholder}
            className="flex-1 text-base"
            style={{ color: palette.textPrimary }}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query ? (
            <Pressable onPress={() => setQuery("")} hitSlop={8} accessibilityLabel="Clear search">
              <X size={18} color={palette.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {txs.isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={palette.accent} />
        </View>
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <Receipt size={48} color={palette.textMuted} strokeWidth={1.4} />
          <Text className="text-[15px] text-center leading-[22px] mt-4" style={{ color: palette.textMuted }}>
            {query ? "No transactions match your search." : "No transactions yet. Your payments will appear here."}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.paymentId}
          contentContainerStyle={{ paddingHorizontal: 21, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl refreshing={txs.isRefetching} onRefresh={() => txs.refetch()} tintColor={palette.accent} />
          }
          renderSectionHeader={({ section }) => (
            <Text className="text-[15px] font-semibold mt-4 mb-1" style={{ color: palette.textPrimary }}>
              {section.title}
            </Text>
          )}
          ItemSeparatorComponent={() => (
            <View className="h-[1px]" style={{ backgroundColor: palette.border, opacity: 0.5 }} />
          )}
          renderItem={({ item }) => (
            <TransactionRow tx={item} onPress={() => openDetail(item.paymentId)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}
