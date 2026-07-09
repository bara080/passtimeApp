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
  const otherSnapshot = useMemo(() => {
    if (!booking.data || !chat) return null;
    const b = booking.data.booking;
    return chat.viewerRole === "member" ? b.hostSnapshot : b.memberSnapshot;
  }, [booking.data, chat]);

  // Live subscription — falls back to REST history if the RTDB listener never
  // fires (no config / offline / rules).
  useEffect(() => {
    if (!chatId) return;
    const unsub = listenForMessages(chatId, (msgs) => {
      if (msgs.length > 0) setMessages(msgs);
    });
    return unsub;
  }, [chatId]);

  // Cold-start hydration from REST — replaces state only if RTDB hasn't filled it.
  useEffect(() => {
    if (history.data && messages.length === 0) setMessages(history.data);
  }, [history.data, messages.length]);

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
    try {
      await send.mutateAsync(text);
    } catch (err) {
      toast.error("Message failed", err instanceof Error ? err.message : "Please try again.");
    }
  }, [send, toast]);

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

  const otherName = otherSnapshot?.displayName ?? (chat.viewerRole === "member" ? "Host" : "Member");
  const otherPhotoUrl = otherSnapshot?.photoUrl;

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
