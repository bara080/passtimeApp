import { View, Text } from "react-native";
import { Check, CheckCheck } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export type MessageDeliveryState = "sent" | "read";

export type MessageBubbleProps = {
  text: string;
  timestamp: number;
  fromSelf: boolean;
  /** Only rendered on self-sent bubbles. */
  deliveryState?: MessageDeliveryState;
};

function time(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** One chat bubble — accent-tinted when sent by me, neutral when received.
 *  Self-sent bubbles show a single tick (sent) or double tick (read). */
export function MessageBubble({ text, timestamp, fromSelf, deliveryState }: MessageBubbleProps) {
  const { palette, isDark } = useThemeColors();

  const bg = fromSelf ? palette.accent : isDark ? "#1a1a1a" : "#f4f4f5";
  const fg = fromSelf ? "#ffffff" : palette.textPrimary;
  const align = fromSelf ? "items-end" : "items-start";
  const bubbleShape = fromSelf ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-bl-md";

  return (
    <View className={`w-full ${align} mb-1.5`}>
      <View className={`max-w-[80%] px-3 py-2 ${bubbleShape}`} style={{ backgroundColor: bg }}>
        <Text className="text-[15px] leading-[20px]" style={{ color: fg }}>
          {text}
        </Text>
      </View>
      <View className="flex-row items-center gap-1 mt-0.5 mx-1">
        <Text className="text-[10px]" style={{ color: palette.textMuted }}>
          {time(timestamp)}
        </Text>
        {fromSelf && deliveryState === "read" ? (
          <CheckCheck size={12} color={palette.accent} />
        ) : fromSelf && deliveryState === "sent" ? (
          <Check size={12} color={palette.textMuted} />
        ) : null}
      </View>
    </View>
  );
}
