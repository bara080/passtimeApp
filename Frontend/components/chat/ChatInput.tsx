import { useState, useRef } from "react";
import { View, TextInput, Pressable } from "react-native";
import { Send } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export type ChatInputProps = {
  onSend: (text: string) => Promise<void> | void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
};

const TYPING_STOP_DELAY_MS = 3000;

/** Text field + accent send button; emits typing start/stop with a debounce. */
export function ChatInput({ onSend, onTyping, disabled, placeholder = "Message…" }: ChatInputProps) {
  const { palette } = useThemeColors();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const typingRef = useRef(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canSend = text.trim().length > 0 && !sending && !disabled;

  const handleChange = (value: string) => {
    setText(value);
    if (!onTyping) return;
    if (value.length > 0 && !typingRef.current) {
      typingRef.current = true;
      onTyping(true);
    }
    if (stopTimer.current) clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(() => {
      typingRef.current = false;
      onTyping(false);
    }, TYPING_STOP_DELAY_MS);
  };

  const handleSend = async () => {
    if (!canSend) return;
    const value = text.trim();
    setSending(true);
    setText("");
    try {
      if (stopTimer.current) clearTimeout(stopTimer.current);
      if (typingRef.current) {
        typingRef.current = false;
        onTyping?.(false);
      }
      await onSend(value);
    } catch {
      setText(value); // restore so the user can retry
    } finally {
      setSending(false);
    }
  };

  return (
    <View
      className="flex-row items-end gap-2 px-4 py-2 border-t"
      style={{ borderColor: palette.border, backgroundColor: palette.background }}
    >
      <TextInput
        value={text}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={palette.placeholder}
        multiline
        maxLength={1000}
        editable={!disabled}
        className="flex-1 min-h-[40px] max-h-[120px] px-3 py-2 rounded-[20px] text-[15px] bg-[#f4f4f5] dark:bg-[#1a1a1a]"
        style={{ color: palette.textPrimary }}
      />
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        accessibilityRole="button"
        accessibilityLabel="Send message"
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{ backgroundColor: canSend ? palette.accent : palette.border, opacity: canSend ? 1 : 0.7 }}
      >
        <Send size={18} color="#ffffff" />
      </Pressable>
    </View>
  );
}
