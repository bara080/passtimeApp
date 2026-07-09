import { View, Text } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export type MessageBubbleProps = {
  text: string;
  timestamp: number;
  fromSelf: boolean;
};

function time(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** One chat bubble — accent-tinted when sent by me, neutral when received. */
export function MessageBubble({ text, timestamp, fromSelf }: MessageBubbleProps) {
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
      <Text className="text-[10px] mt-0.5 mx-1" style={{ color: palette.textMuted }}>
        {time(timestamp)}
      </Text>
    </View>
  );
}
