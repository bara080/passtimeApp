import { useCallback, useEffect, useState } from "react";
import { View, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/context/ToastProvider";
import {
  HomeHeader,
  HomeSearchBar,
  CategoryCarousel,
  SectionHeader,
  HostCarousel,
  UpcomingBookingCard,
} from "@/components/home";
import { useDiscoverHosts } from "@/services/hosts/hooks";
import { useFavoriteIds, useToggleFavorite } from "@/services/favorites/hooks";
import { useMyBookings } from "@/services/bookings/hooks";
import { useCreateChat } from "@/services/chat/hooks";
import type { HostCard } from "@/services/hosts/types";
import type { ExperienceTypeKey } from "@/services/host/types";
import { getRecentlyViewed, addRecentlyViewed } from "@/utils/recentlyViewed";
import { trackEvent } from "@/utils/analytics";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { routeForNotificationData } from "@/utils/notificationRoutes";
import type { NotificationType } from "@/services/notifications/types";

export default function HomeScreen() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();

  // Member location isn't collected yet (memberDesign.md deviation) — the
  // header prompts "Set your location" and "nearby" stays hidden until then.
  const memberCity: string | null = null;

  const upcoming = useMyBookings("upcoming");
  const current = useMyBookings("current");
  const nextUpcoming = upcoming.data?.[0];
  const activeBooking = current.data?.[0];

  const createChat = useCreateChat();
  const openChatForBooking = async (bookingId: string) => {
    try {
      const res = await createChat.mutateAsync(bookingId);
      router.push({ pathname: "/(app)/chat/[chatId]", params: { chatId: res.chat.chatId } } as unknown as Href);
    } catch (err) {
      toast.error("Could not open chat", err instanceof Error ? err.message : "Please try again.");
    }
  };

  const recommended = useDiscoverHosts({ section: "recommended", limit: 10 });
  const nearby = useDiscoverHosts(
    { section: "nearby", city: memberCity ?? undefined, limit: 10 },
    { enabled: Boolean(memberCity) }
  );
  const [recentUids, setRecentUids] = useState<string[]>([]);

  // Favorites: heart overlay on discovery cards, backed by the /favorites API.
  const { ids: favoriteIds } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  const onToggleFavorite = (host: HostCard) =>
    toggleFavorite.mutate({ hostUid: host.uid, favorited: favoriteIds.has(host.uid) });

  useEffect(() => {
    trackEvent("home.viewed");
    getRecentlyViewed().then((entries) => setRecentUids(entries.map((e) => e.uid)));
  }, []);

  // Register for push (no-op in Expo Go / simulator) and deep-link on tap.
  usePushNotifications(user?.uid ?? null, (data) => {
    const type = (data.type as NotificationType) || "general";
    const target = routeForNotificationData(type, data as Record<string, unknown>);
    if (target) router.push(target as unknown as Href);
  });

  const openHost = (host: HostCard, section: string) => {
    trackEvent("home.host.tap", { uid: host.uid, section });
    addRecentlyViewed(host.uid);
    setRecentUids((prev) => [host.uid, ...prev.filter((u) => u !== host.uid)].slice(0, 10));
    // Dedicated host-profile screen is its own plan (Figma 1288:6539); for
    // now the card tap jumps straight into the booking flow.
    router.push({
      pathname: "/(app)/book/[hostUid]",
      params: { hostUid: host.uid, hostName: host.firstName || host.displayName },
    } as unknown as Href);
  };

  const openCategory = (key: ExperienceTypeKey) => {
    trackEvent("home.category.tap", { key });
    router.push({ pathname: "/(app)/explore", params: { category: key } });
  };

  const openSearch = () => {
    trackEvent("home.search.tap");
    router.push("/(app)/explore");
  };

  const seeAll = (section: string) => {
    trackEvent("home.seeall.tap", { section });
    router.push({ pathname: "/(app)/explore", params: { section } });
  };

  const refreshing = recommended.isRefetching || nearby.isRefetching;
  const onRefresh = useCallback(() => {
    recommended.refetch();
    nearby.refetch();
  }, [recommended, nearby]);

  // Recently viewed v1: hydrate from already-fetched cards (client-only history).
  const loadedHosts = [...(recommended.data ?? []), ...(nearby.data ?? [])];
  const recentlyViewedHosts = recentUids
    .map((uid) => loadedHosts.find((h) => h.uid === uid))
    .filter((h): h is HostCard => Boolean(h));

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <ScrollView
        className="flex-1 px-[21px] pt-2"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff6633" />}
      >
        <HomeHeader
          addressLine={memberCity}
          avatarUrl={user?.avatarUrl}
          onPressBell={() => router.push("/(app)/notifications" as unknown as Href)}
          onPressAvatar={() => router.push("/(app)/profile")}
        />
        <HomeSearchBar onPress={openSearch} />

        <SectionHeader title="Explore by categories" />
        <CategoryCarousel onSelect={openCategory} />

        {activeBooking ? (
          <>
            <SectionHeader title="Current booking" />
            <UpcomingBookingCard
              booking={activeBooking}
              active
              onView={() =>
                router.push({
                  pathname: "/(app)/bookings/[bookingId]",
                  params: { bookingId: activeBooking.bookingId },
                } as unknown as Href)
              }
              onChat={() => openChatForBooking(activeBooking.bookingId)}
            />
          </>
        ) : nextUpcoming ? (
          <>
            <SectionHeader title="Upcoming booking" />
            <UpcomingBookingCard
              booking={nextUpcoming}
              onView={() =>
                router.push({
                  pathname: "/(app)/bookings/[bookingId]",
                  params: { bookingId: nextUpcoming.bookingId },
                } as unknown as Href)
              }
              onChat={() => openChatForBooking(nextUpcoming.bookingId)}
            />
          </>
        ) : null}

        <SectionHeader title="Recommended for You" onSeeAll={() => seeAll("recommended")} />
        <HostCarousel
          hosts={recommended.data}
          loading={recommended.isPending}
          onPressHost={(h) => openHost(h, "recommended")}
          favoriteIds={favoriteIds}
          onToggleFavorite={onToggleFavorite}
        />

        {memberCity ? (
          <>
            <SectionHeader title="Hosts near you" onSeeAll={() => seeAll("nearby")} />
            <HostCarousel
              hosts={nearby.data}
              loading={nearby.isPending}
              onPressHost={(h) => openHost(h, "nearby")}
              favoriteIds={favoriteIds}
              onToggleFavorite={onToggleFavorite}
            />
          </>
        ) : null}

        {recentlyViewedHosts.length > 0 ? (
          <>
            <SectionHeader title="Recently viewed" />
            <HostCarousel
              hosts={recentlyViewedHosts}
              loading={false}
              onPressHost={(h) => openHost(h, "recent")}
              favoriteIds={favoriteIds}
              onToggleFavorite={onToggleFavorite}
            />
          </>
        ) : null}

        <View className="h-28" />
      </ScrollView>
    </SafeAreaView>
  );
}
