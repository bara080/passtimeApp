import { View, Text, Pressable } from "react-native";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react-native";
import { colors } from "@/constants/theme";
import type { ToastData } from "@/context/ToastProvider";

const TYPE_STYLES = {
  success: { icon: CheckCircle, tint: colors.success },
  error: { icon: AlertCircle, tint: "#e53935" },
  info: { icon: Info, tint: colors.accent },
} as const;

export type ToastViewProps = {
  toast: ToastData;
  onDismiss: (id: string) => void;
};

/** Presentational toast card: tinted icon, title, optional message, dismiss. */
export function ToastView({ toast, onDismiss }: ToastViewProps) {
  const { icon: Icon, tint } = TYPE_STYLES[toast.type];

  return (
    <Pressable
      onPress={() => onDismiss(toast.id)}
      accessibilityRole="alert"
      className="flex-row items-start bg-white rounded-[12px] px-4 py-3 mb-2 mx-[21px]"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: tint,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      }}
    >
      <Icon size={22} color={tint} style={{ marginTop: 2 }} />
      <View className="flex-1 ml-3">
        <Text className="text-[15px] text-[#1a1a1a] font-semibold">{toast.title}</Text>
        {toast.message ? (
          <Text className="text-[13px] text-[#555] mt-0.5 leading-[18px]">{toast.message}</Text>
        ) : null}
      </View>
      <X size={16} color="#999" style={{ marginTop: 3 }} />
    </Pressable>
  );
}
