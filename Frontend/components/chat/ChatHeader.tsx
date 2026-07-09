import { useState } from "react";
import { View, Text, Pressable, Image, Modal } from "react-native";
import { MoreVertical, User, Eraser, XSquare } from "lucide-react-native";
import { BackButton } from "@/components/ui/BackButton";
import { useThemeColors } from "@/hooks/useThemeColors";

export type ChatHeaderProps = {
  otherName: string;
  otherPhotoUrl?: string | null;
  otherSubtitle?: string;
  onClear?: () => void;
  onClose?: () => void;
  chatClosed?: boolean;
};

/** Header for the chat detail screen: back, counterparty, kebab menu (Figma 6949 options sheet). */
export function ChatHeader({ otherName, otherPhotoUrl, otherSubtitle, onClear, onClose, chatClosed }: ChatHeaderProps) {
  const { palette } = useThemeColors();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View className="flex-row items-center gap-3 px-4 py-3 border-b" style={{ borderColor: palette.border }}>
      <BackButton />
      {otherPhotoUrl ? (
        <Image source={{ uri: otherPhotoUrl }} className="w-9 h-9 rounded-full" />
      ) : (
        <View className="w-9 h-9 rounded-full items-center justify-center bg-[#f0f0f0] dark:bg-[#1a1a1a]">
          <User size={18} color={palette.textMuted} />
        </View>
      )}
      <View className="flex-1">
        <Text className="text-base font-semibold" style={{ color: palette.textPrimary }} numberOfLines={1}>
          {otherName}
        </Text>
        {otherSubtitle ? (
          <Text className="text-xs" style={{ color: palette.textMuted }} numberOfLines={1}>
            {chatClosed ? "Chat closed" : otherSubtitle}
          </Text>
        ) : chatClosed ? (
          <Text className="text-xs" style={{ color: palette.textMuted }}>
            Chat closed
          </Text>
        ) : null}
      </View>
      {onClear || onClose ? (
        <Pressable onPress={() => setMenuOpen(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Chat options">
          <MoreVertical size={22} color={palette.textPrimary} />
        </Pressable>
      ) : null}

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable className="flex-1 bg-black/30" onPress={() => setMenuOpen(false)}>
          <Pressable
            onPress={() => {}}
            className="absolute right-5 top-20 rounded-[12px] w-[220px] py-2 bg-white dark:bg-[#1a1a1a]"
            style={{ shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}
          >
            {onClear ? (
              <MenuItem
                Icon={Eraser}
                label="Clear chat for me"
                onPress={() => {
                  setMenuOpen(false);
                  onClear();
                }}
              />
            ) : null}
            {onClose && !chatClosed ? (
              <MenuItem
                Icon={XSquare}
                label="Close conversation"
                destructive
                onPress={() => {
                  setMenuOpen(false);
                  onClose();
                }}
              />
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function MenuItem({
  Icon,
  label,
  onPress,
  destructive,
}: {
  Icon: typeof Eraser;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const { palette } = useThemeColors();
  const color = destructive ? "#c62828" : palette.textPrimary;
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 px-4 py-3">
      <Icon size={18} color={color} />
      <Text className="text-[15px]" style={{ color }}>
        {label}
      </Text>
    </Pressable>
  );
}
