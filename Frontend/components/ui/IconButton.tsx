import { Pressable } from "react-native";
import type { PropsWithChildren } from "react";

export type IconButtonProps = PropsWithChildren<{
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
}>;

/** Small icon-only pressable with a generous hit area. */
export function IconButton({ onPress, accessibilityLabel, disabled, children }: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={10}
      className="w-9 h-9 items-center justify-center rounded-full"
      style={{ opacity: disabled ? 0.4 : 1 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </Pressable>
  );
}
