import { Tabs, type Href } from "expo-router";
import { TabBar } from "@/components/navigation/TabBar";
import { HostTabBar } from "@/components/navigation/HostTabBar";
import { useAuth } from "@/context/AuthProvider";

/** Two-shape tab bar: hosts get Dashboard/Schedule/Requests/Messages/Profile,
 *  members keep Home/Likes/Messages/Profile + search FAB. Hosts landing at
 *  `/(app)` are redirected to `/(app)/dashboard` (the member Home is hidden
 *  for them anyway; the redirect avoids showing an empty layout mid-mount). */
export default function AppLayout() {
  const { user, initializing } = useAuth();
  const isHost = user?.role === "host";

  // Session still resolving — let the root layout keep the splash up.
  if (initializing) return null;

  return (
    <Tabs
      tabBar={(props) => (isHost ? <HostTabBar {...props} /> : <TabBar {...props} />)}
      screenOptions={{ headerShown: false }}
    >
      {/* Member-only tabs */}
      <Tabs.Screen name="index" options={{ title: "Home", href: isHost ? null : ("/(app)" as Href) }} />
      <Tabs.Screen name="likes" options={{ title: "Likes", href: isHost ? null : ("/(app)/likes" as Href) }} />

      {/* Host-only tabs (cast until expo-router regenerates typed routes) */}
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard", href: isHost ? ("/(app)/dashboard" as unknown as Href) : null }} />
      <Tabs.Screen name="schedule" options={{ title: "Schedule", href: isHost ? ("/(app)/schedule" as unknown as Href) : null }} />
      <Tabs.Screen name="requests" options={{ title: "Requests", href: isHost ? ("/(app)/requests" as unknown as Href) : null }} />

      {/* Shared */}
      <Tabs.Screen name="messages" options={{ title: "Messages" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />

      {/* Reachable but not in the tab bar. Nested pages use their full route
          keys (expo-router generates one entry per file, not per folder). */}
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="bookings" options={{ href: null }} />
      <Tabs.Screen name="bookings/[bookingId]" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="book/[hostUid]" options={{ href: null }} />
      <Tabs.Screen name="book/venue" options={{ href: null }} />
      <Tabs.Screen name="book/summary" options={{ href: null }} />
      <Tabs.Screen name="chat/[chatId]" options={{ href: null }} />
      <Tabs.Screen name="host/stripe-onboarding" options={{ href: null }} />
    </Tabs>
  );
}
