import { View, Text, Pressable, Image } from "react-native";
import { User } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { Chat } from "@/services/chat/types";

export type ChatCardProps = {
  chat: Chat;
  /** Counterparty display name + photo pulled from the surrounding context. */
  otherName: string;
  otherPhotoUrl?: string | null;
  onPress: () => void;
};

function relative(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const secs = Math.max(1, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return "now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Row on the Messages list (Figma 1288:6856). */
export function ChatCard({ chat, otherName, otherPhotoUrl, onPress }: ChatCardProps) {
  const { palette } = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open chat with ${otherName}`}
      className="flex-row items-center gap-3 py-3 border-b"
      style={{ borderColor: palette.border }}
    >
      {otherPhotoUrl ? (
        <Image source={{ uri: otherPhotoUrl }} className="w-12 h-12 rounded-full" />
      ) : (
        <View className="w-12 h-12 rounded-full items-center justify-center bg-[#f0f0f0] dark:bg-[#1a1a1a]">
          <User size={22} color={palette.textMuted} />
        </View>
      )}
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text
            className="text-[15px] flex-1"
            style={{ color: palette.textPrimary, fontWeight: chat.unread ? "700" : "500" }}
            numberOfLines={1}
          >
            {otherName}
          </Text>
          <Text className="text-xs ml-2" style={{ color: chat.unread ? palette.accent : palette.textMuted }}>
            {relative(chat.lastMessageAt)}
          </Text>
        </View>
        <View className="flex-row items-center justify-between mt-0.5">
          <Text
            className="text-sm flex-1"
            style={{ color: chat.unread ? palette.textPrimary : palette.textMuted, fontWeight: chat.unread ? "500" : "400" }}
            numberOfLines={1}
          >
            {chat.lastMessage || "No messages yet"}
          </Text>
          {chat.unread ? (
            <View className="w-2 h-2 rounded-full ml-2" style={{ backgroundColor: palette.accent }} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
