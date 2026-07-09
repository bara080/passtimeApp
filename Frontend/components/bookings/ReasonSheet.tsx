import { useState, useEffect } from "react";
import { View, Text, Modal, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { AppButton, TextInputBox } from "@/components/ui";
import { useThemeColors } from "@/hooks/useThemeColors";

export type ReasonSheetProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void> | void;
  submitting?: boolean;
  /** If true, empty reasons are rejected — used for host decline. */
  reasonRequired?: boolean;
};

/** Bottom sheet with a reason textarea and submit CTA — used by decline & cancel flows. */
export function ReasonSheet({
  visible,
  title,
  subtitle,
  submitLabel,
  onClose,
  onSubmit,
  submitting,
  reasonRequired,
}: ReasonSheetProps) {
  const { palette } = useThemeColors();
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!visible) setReason("");
  }, [visible]);

  const valid = !reasonRequired || reason.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Pressable
            className="bg-white dark:bg-[#0d0d0d] rounded-t-[20px] px-[21px] pt-6 pb-10"
            onPress={() => {}}
          >
            <Text className="text-[22px] font-semibold mb-2" style={{ color: palette.textPrimary }}>
              {title}
            </Text>
            {subtitle ? (
              <Text className="text-sm mb-4" style={{ color: palette.textMuted }}>
                {subtitle}
              </Text>
            ) : null}
            <TextInputBox
              label="Reason"
              value={reason}
              onChangeText={setReason}
              placeholder="Share a short reason (optional)"
              maxLength={500}
            />
            <AppButton
              label={submitLabel}
              onPress={() => onSubmit(reason.trim())}
              loading={submitting}
              disabled={!valid}
            />
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
