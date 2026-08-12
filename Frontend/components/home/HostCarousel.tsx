import { View, Text, FlatList } from "react-native";
import { HostCard } from "./HostCard";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { HostCard as HostCardData } from "@/services/hosts/types";

export type HostCarouselProps = {
  hosts: HostCardData[] | undefined;
  loading: boolean;
  onPressHost: (host: HostCardData) => void;
  emptyText?: string;
  /** When provided, each card shows a heart reflecting membership in this set. */
  favoriteIds?: Set<string>;
  onToggleFavorite?: (host: HostCardData) => void;
};

/** Horizontal host strip with skeleton and empty states. */
export function HostCarousel({
  hosts,
  loading,
  onPressHost,
  emptyText = "No hosts yet — check back soon.",
  favoriteIds,
  onToggleFavorite,
}: HostCarouselProps) {
  const { palette } = useThemeColors();

  if (loading) {
    return (
      <View className="flex-row gap-3">
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            className="rounded-[14px] bg-[#ececec] dark:bg-[#1a1a1a]"
            style={{ width: 160, aspectRatio: 0.8, opacity: 0.7 - i * 0.15 }}
          />
        ))}
      </View>
    );
  }

  if (!hosts || hosts.length === 0) {
    return (
      <Text className="text-sm py-6" style={{ color: palette.textMuted }}>
        {emptyText}
      </Text>
    );
  }

  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={hosts}
      keyExtractor={(h) => h.uid}
      contentContainerStyle={{ gap: 12, paddingRight: 21 }}
      renderItem={({ item }) => (
        <HostCard
          host={item}
          onPress={() => onPressHost(item)}
          isFavorite={favoriteIds?.has(item.uid)}
          onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item) : undefined}
        />
      )}
    />
  );
}
