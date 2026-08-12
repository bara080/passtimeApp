import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, type Href } from "expo-router";
import { Search, X } from "lucide-react-native";
import { BackButton } from "@/components/ui/BackButton";
import { HostCard } from "@/components/home";
import { EXPERIENCE_TYPES } from "@/components/onboarding";
import { useDiscoverHosts } from "@/services/hosts/hooks";
import { useFavoriteIds, useToggleFavorite } from "@/services/favorites/hooks";
import { addRecentlyViewed } from "@/utils/recentlyViewed";
import { trackEvent } from "@/utils/analytics";
import type { ExperienceTypeKey } from "@/services/host/types";
import { useThemeColors } from "@/hooks/useThemeColors";

const GAP = 14;
const PAD = 21;

/** Member Explore / search screen. Category chips filter server-side via
 *  /host/discover; the text box filters the returned cards client-side by name,
 *  city, or experience. Reuses the Home discovery card language (Figma 1288:6397). */
export default function ExploreScreen() {
  const router = useRouter();
  const { palette } = useThemeColors();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ category?: string }>();

  const initialCategory = (params.category as ExperienceTypeKey) || null;
  const [category, setCategory] = useState<ExperienceTypeKey | null>(initialCategory);
  const [query, setQuery] = useState("");

  const discover = useDiscoverHosts({ section: "recommended", category: category ?? undefined, limit: 30 });
  const { ids: favoriteIds } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();

  const cardWidth = (width - PAD * 2 - GAP) / 2;

  const hosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = discover.data ?? [];
    if (!q) return all;
    return all.filter(
      (h) =>
        h.displayName.toLowerCase().includes(q) ||
        (h.city ?? "").toLowerCase().includes(q) ||
        h.experienceTypes.some((t) => t.replace(/-/g, " ").includes(q))
    );
  }, [discover.data, query]);

  const openHost = (uid: string, name: string) => {
    trackEvent("explore.host.tap", { uid });
    addRecentlyViewed(uid);
    router.push({ pathname: "/(app)/book/[hostUid]", params: { hostUid: uid, hostName: name } } as unknown as Href);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <View className="px-[21px] pt-4">
        <View className="flex-row items-center gap-3 mb-4">
          <BackButton onPress={() => router.back()} />
          <Text className="text-[26px] font-semibold" style={{ color: palette.textPrimary }}>
            Explore
          </Text>
        </View>

        {/* Search box */}
        <View className="flex-row items-center gap-3 h-12 rounded-full px-4 bg-[#f4f4f5] dark:bg-[#1a1a1a] border border-transparent dark:border-[#333333]">
          <Search size={18} color={palette.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search hosts, cities, experiences…"
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

        {/* Category filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 14, paddingRight: 21 }}
        >
          <Chip label="All" active={category === null} onPress={() => setCategory(null)} palette={palette} />
          {EXPERIENCE_TYPES.map((t) => (
            <Chip
              key={t.key}
              label={t.label}
              active={category === t.key}
              onPress={() => setCategory(category === t.key ? null : t.key)}
              palette={palette}
            />
          ))}
        </ScrollView>
      </View>

      {discover.isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={palette.accent} />
        </View>
      ) : hosts.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <Text className="text-[15px] text-center leading-[22px]" style={{ color: palette.textMuted }}>
            {query || category
              ? "No hosts match your search. Try a different category or term."
              : "No hosts available yet — check back soon."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={hosts}
          keyExtractor={(h) => h.uid}
          numColumns={2}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={{ paddingHorizontal: PAD, paddingBottom: 120, gap: GAP }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <HostCard
              host={item}
              width={cardWidth}
              isFavorite={favoriteIds.has(item.uid)}
              onToggleFavorite={() => toggleFavorite.mutate({ hostUid: item.uid, favorited: favoriteIds.has(item.uid) })}
              onPress={() => openHost(item.uid, item.firstName || item.displayName)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function Chip({
  label,
  active,
  onPress,
  palette,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  palette: { accent: string; border: string; textPrimary: string; surface: string };
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className="px-4 py-2 rounded-full border"
      style={{
        backgroundColor: active ? palette.accent : "transparent",
        borderColor: active ? palette.accent : palette.border,
      }}
    >
      <Text className="text-[13px] font-medium" style={{ color: active ? "#ffffff" : palette.textPrimary }}>
        {label}
      </Text>
    </Pressable>
  );
}
