import { Tabs } from "expo-router";
import { TabBar } from "@/components/navigation/TabBar";

export default function AppLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="likes" options={{ title: "Likes" }} />
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
