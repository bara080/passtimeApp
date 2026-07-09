import { View, Text, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import { MessageSquare } from "lucide-react-native";
import { useAuth } from "@/context/AuthProvider";
import { useChats } from "@/context/ChatProvider";
import { useChatList } from "@/services/chat/hooks";
import { ChatCard } from "@/components/chat";
import { EmptyState } from "@/components/ui/EmptyState";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { chats, loading } = useChats();
  const list = useChatList(Boolean(user));
  const { palette } = useThemeColors();

  const viewerIsMember = user?.role === "member";

  if (!loading && chats.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
        <View className="px-[21px] pt-4">
          <Text className="text-[26px] font-semibold" style={{ color: palette.textPrimary }}>
            Messages
          </Text>
        </View>
        <EmptyState
          Icon={MessageSquare}
          heading="No Conversations Yet"
          body="Messages will appear here after a booking is confirmed with a host."
          tip="Messaging unlocks only after both people accept a booking request."
          ctaLabel="Explore Hosts"
          onCta={() => router.push("/(app)/explore" as unknown as Href)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <View className="px-[21px] pt-4 pb-2">
        <Text className="text-[26px] font-semibold" style={{ color: palette.textPrimary }}>
          Messages
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={palette.accent} />
      ) : (
        <FlatList
          contentContainerStyle={{ paddingHorizontal: 21, paddingBottom: 100 }}
          data={chats}
          keyExtractor={(c) => c.chatId}
          renderItem={({ item }) => (
            <ChatCard
              chat={item}
              // v1: the list endpoint returns uids; a display name lookup lives
              // in the chat detail. Show short-form for now; slice-5 style pass
              // can decorate this list with counterparty snapshots.
              otherName={viewerIsMember ? "Host" : "Member"}
              otherPhotoUrl={null}
              onPress={() =>
                router.push({ pathname: "/(app)/chat/[chatId]", params: { chatId: item.chatId } } as unknown as Href)
              }
            />
          )}
          refreshControl={<RefreshControl refreshing={list.isRefetching} onRefresh={list.refetch} tintColor="#ff6633" />}
        />
      )}
    </SafeAreaView>
  );
}
