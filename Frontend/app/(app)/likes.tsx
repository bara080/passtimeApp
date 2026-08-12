import { View, Text, FlatList, ActivityIndicator, RefreshControl, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import { Heart } from "lucide-react-native";
import { EmptyState } from "@/components/ui/EmptyState";
import { HostCard } from "@/components/home";
import { useFavorites, useToggleFavorite } from "@/services/favorites/hooks";
import { addRecentlyViewed } from "@/utils/recentlyViewed";
import { trackEvent } from "@/utils/analytics";
import { useThemeColors } from "@/hooks/useThemeColors";

const GAP = 14;
const PAD = 21;

/** Member Likes tab (Figma 1288:6397 tab bar heart). Saved hosts in a 2-up grid;
 *  the heart on each card removes it. Empty → the discovery nudge. */
export default function LikesScreen() {
  const router = useRouter();
  const { palette } = useThemeColors();
  const { width } = useWindowDimensions();
  const favorites = useFavorites();
  const toggle = useToggleFavorite();

  const cardWidth = (width - PAD * 2 - GAP) / 2;
  const hosts = favorites.data?.hosts ?? [];

  const openHost = (uid: string, name: string) => {
    trackEvent("likes.host.tap", { uid });
    addRecentlyViewed(uid);
    router.push({ pathname: "/(app)/book/[hostUid]", params: { hostUid: uid, hostName: name } } as unknown as Href);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <View className="px-[21px] pt-4 pb-2">
        <Text className="text-[26px] font-semibold" style={{ color: palette.textPrimary }}>
          Likes
        </Text>
      </View>

      {favorites.isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={palette.accent} />
        </View>
      ) : hosts.length === 0 ? (
        <EmptyState
          Icon={Heart}
          heading="No Likes Yet"
          body={"When you find hosts you like, tap the ♥ icon to save them here. You can easily book them later."}
          tip="Liking profiles helps us recommend better matches."
          ctaLabel="Explore Hosts"
          onCta={() => router.push("/(app)/explore")}
        />
      ) : (
        <FlatList
          data={hosts}
          keyExtractor={(h) => h.uid}
          numColumns={2}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={{ paddingHorizontal: PAD, paddingBottom: 120, gap: GAP }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={favorites.isRefetching}
              onRefresh={() => favorites.refetch()}
              tintColor={palette.accent}
            />
          }
          renderItem={({ item }) => (
            <HostCard
              host={item}
              width={cardWidth}
              isFavorite
              onToggleFavorite={() => toggle.mutate({ hostUid: item.uid, favorited: true })}
              onPress={() => openHost(item.uid, item.firstName || item.displayName)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
