import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/AuthProvider";
import { useChatDetails, useChatHistory, useSendMessage, useMarkChatRead, useCloseChat, useClearChat } from "@/services/chat/hooks";
import { listenForMessages, listenForTyping, setTyping, type RtdbMessage } from "@/services/firebase/chat.service";
import { useBookingDetails } from "@/services/bookings/hooks";
import { ChatHeader, ChatInput, DateSeparator, MessageBubble, TypingIndicator } from "@/components/chat";
import { useToast } from "@/context/ToastProvider";
import { useThemeColors } from "@/hooks/useThemeColors";

type Row =
  | { type: "message"; message: RtdbMessage; fromSelf: boolean }
  | { type: "date"; label: string };

function labelForDate(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" });
}

function groupWithSeparators(messages: RtdbMessage[], myUid: string): Row[] {
  const rows: Row[] = [];
  let lastLabel = "";
  for (const m of messages) {
    const label = labelForDate(m.timestamp);
    if (label !== lastLabel) {
      rows.push({ type: "date", label });
      lastLabel = label;
    }
    rows.push({ type: "message", message: m, fromSelf: m.sender === myUid });
  }
  return rows;
}

export default function ChatDetailScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { user } = useAuth();
  const toast = useToast();
  const { palette } = useThemeColors();

  const details = useChatDetails(chatId ?? null);
  const history = useChatHistory(chatId ?? null);
  const send = useSendMessage(chatId ?? "");
  const markRead = useMarkChatRead();
  const closeChat = useCloseChat();
  const clearChat = useClearChat();

  const [messages, setMessages] = useState<RtdbMessage[]>([]);
  const [otherTyping, setOtherTyping] = useState(false);
  const listRef = useRef<FlatList<Row>>(null);
  const chat = details.data?.chat;
  const booking = useBookingDetails(chat?.bookingId ?? null);
  // Prefer the fresh server-side profile (chat.md §5b) — falls back to the
  // booking-time snapshot if the extended getChat response isn't available yet.
  const otherProfile = useMemo(() => {
    if (!details.data || !chat) return null;
    const p = chat.viewerRole === "member" ? details.data.hostProfile : details.data.memberProfile;
    if (p?.displayName || p?.avatarUrl) return p;
    if (!booking.data) return p;
    const b = booking.data.booking;
    const snap = chat.viewerRole === "member" ? b.hostSnapshot : b.memberSnapshot;
    return { uid: "", displayName: snap.displayName, avatarUrl: snap.photoUrl ?? null, professionalRole: null };
  }, [details.data, booking.data, chat]);

  // Live subscription — falls back to REST history if the RTDB listener never
  // fires (no config / offline / rules).
  useEffect(() => {
    if (!chatId) return;
    const unsub = listenForMessages(chatId, (msgs) => {
      if (msgs.length > 0) setMessages(msgs);
    });
    return unsub;
  }, [chatId]);

  // Hydration + polling merge: whenever REST history refreshes, take its
  // messages as authoritative but preserve any local optimistic entries that
  // haven't been reflected server-side yet (identified by their `optimistic-`
  // id prefix). Also skip if the RTDB listener is already ahead.
  useEffect(() => {
    if (!history.data) return;
    setMessages((prev) => {
      const rtdbAhead = prev.length > history.data.length &&
        !prev.every((m) => m.id.startsWith("optimistic-"));
      if (rtdbAhead) return prev;
      const optimisticQueue = prev.filter((m) => m.id.startsWith("optimistic-"));
      const merged = [...history.data];
      for (const opt of optimisticQueue) {
        if (!merged.some((m) => m.text === opt.text && m.sender === opt.sender && Math.abs(m.timestamp - opt.timestamp) < 5000)) {
          merged.push(opt);
        }
      }
      return merged;
    });
  }, [history.data]);

  // Typing presence — only my counterparty triggers the indicator.
  useEffect(() => {
    if (!chatId || !user?.uid) return;
    return listenForTyping(chatId, user.uid, (t) => setOtherTyping(Boolean(t)));
  }, [chatId, user?.uid]);

  // Mark this chat as read once the screen mounts and every time new messages arrive.
  useEffect(() => {
    if (!chatId || !chat || !chat.unread) return;
    markRead.mutate(chatId);
  }, [chatId, chat, messages.length]);

  const rows = useMemo(() => (user?.uid ? groupWithSeparators(messages, user.uid) : []), [messages, user?.uid]);

  const onSend = useCallback(async (text: string) => {
    if (!user?.uid) return;
    // Optimistic append — the sender sees their own message immediately even
    // if RTDB is disabled or the listener hasn't fired yet. If the send
    // fails, we roll it back below.
    const optimisticId = `optimistic-${user.uid}-${Date.now()}`;
    const optimistic: RtdbMessage = {
      id: optimisticId,
      sender: user.uid,
      senderRole: chat?.viewerRole ?? "member",
      senderName: user.displayName || user.firstName || "You",
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const res = await send.mutateAsync(text);
      // Replace the optimistic entry with the real one when we can build it.
      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => m.id !== optimisticId);
        const real: RtdbMessage = {
          id: res.messageId,
          sender: user.uid,
          senderRole: optimistic.senderRole,
          senderName: optimistic.senderName,
          text,
          timestamp: optimistic.timestamp,
        };
        // Dedup against a listener that may have already delivered the same id.
        if (withoutOptimistic.some((m) => m.id === real.id)) return withoutOptimistic;
        return [...withoutOptimistic, real];
      });
      // Also refetch REST history so the receiver's next poll is consistent.
      history.refetch();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      toast.error("Message failed", err instanceof Error ? err.message : "Please try again.");
    }
  }, [send, toast, user?.uid, user?.displayName, user?.firstName, chat?.viewerRole, history]);

  const onTyping = useCallback((isTyping: boolean) => {
    if (!chatId || !user?.uid) return;
    setTyping(chatId, user.uid, isTyping).catch(() => {});
  }, [chatId, user?.uid]);

  if (details.isPending) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d] items-center justify-center">
        <ActivityIndicator color={palette.accent} />
      </SafeAreaView>
    );
  }
  if (details.isError || !chat) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
        <ChatHeader otherName="Chat" />
        <View className="px-[21px] pt-6">
          <Text className="text-sm text-red-500">This chat is unavailable.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const otherName = otherProfile?.displayName ?? (chat.viewerRole === "member" ? "Host" : "Member");
  const otherPhotoUrl = otherProfile?.avatarUrl;
  // Read-receipt threshold: my message is "read" if the OTHER side has read
  // the chat past its timestamp (chat.md §5c).
  const otherLastReadAt = chat.viewerRole === "member" ? chat.lastReadAt.host : chat.lastReadAt.member;
  const otherLastReadTs = otherLastReadAt ? new Date(otherLastReadAt).getTime() : 0;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ChatHeader
          otherName={otherName}
          otherPhotoUrl={otherPhotoUrl}
          chatClosed={chat.status === "closed"}
          onClear={() => clearChat.mutate(chatId!)}
          onClose={() => closeChat.mutate(chatId!)}
        />

        <FlatList
          ref={listRef}
          data={rows}
          keyExtractor={(row, i) => (row.type === "message" ? row.message.id : `date-${i}-${row.label}`)}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12 }}
          renderItem={({ item }) =>
            item.type === "date" ? (
              <DateSeparator label={item.label} />
            ) : (
              <MessageBubble
                text={item.message.text}
                timestamp={item.message.timestamp}
                fromSelf={item.fromSelf}
                deliveryState={
                  item.fromSelf
                    ? item.message.timestamp <= otherLastReadTs
                      ? "read"
                      : "sent"
                    : undefined
                }
              />
            )
          }
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />
        <TypingIndicator visible={otherTyping} name={otherName.split(" ")[0]} />
        <ChatInput
          onSend={onSend}
          onTyping={onTyping}
          disabled={chat.status === "closed" || send.isPending}
          placeholder={chat.status === "closed" ? "Chat is closed" : "Message…"}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
