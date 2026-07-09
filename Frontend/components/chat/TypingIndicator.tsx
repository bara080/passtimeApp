import { useEffect, useRef } from "react";
import { View, Text, Animated, Easing } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export type TypingIndicatorProps = {
  name?: string;
  visible: boolean;
};

/** "X is typing…" with three softly pulsing dots. */
export function TypingIndicator({ name, visible }: TypingIndicatorProps) {
  const { palette, isDark } = useThemeColors();
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    if (!visible) return;
    const anims = dots.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(v, { toValue: 1, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [visible]);

  if (!visible) return null;

  return (
    <View className="flex-row items-center gap-2 px-4 py-2">
      <View
        className="flex-row items-center gap-1 rounded-[16px] px-3 py-2"
        style={{ backgroundColor: isDark ? "#1a1a1a" : "#f4f4f5" }}
      >
        {dots.map((v, i) => (
          <Animated.View
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: palette.textMuted,
              opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
              transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) }],
            }}
          />
        ))}
      </View>
      <Text className="text-xs" style={{ color: palette.textMuted }}>
        {name ? `${name} is typing…` : "typing…"}
      </Text>
    </View>
  );
}
