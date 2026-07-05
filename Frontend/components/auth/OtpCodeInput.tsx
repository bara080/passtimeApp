import { useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, type TextInputProps } from "react-native";
import { colors } from "@/constants/theme";

export type OtpCodeInputProps = {
  /** Number of digits (5 for SMS, 6 for email). */
  length: number;
  value: string;
  /** Receives digits-only input, capped at `length`. */
  onChangeText: (digits: string) => void;
  autoFocus?: boolean;
  autoComplete?: TextInputProps["autoComplete"];
};

/** Boxed one-time-code input backed by a hidden TextInput (keeps native keyboard + OTP autofill). */
export function OtpCodeInput({ length, value, onChangeText, autoFocus = true, autoComplete = "one-time-code" }: OtpCodeInputProps) {
  const inputRef = useRef<TextInput>(null);

  const handleChange = (text: string) => {
    onChangeText(text.replace(/\D/g, "").slice(0, length));
  };

  return (
    <View>
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        textContentType="oneTimeCode"
        autoComplete={autoComplete}
        caretHidden
      />
      <TouchableOpacity style={styles.row} onPress={() => inputRef.current?.focus()} activeOpacity={1}>
        {Array.from({ length }).map((_, i) => (
          <View key={i} style={[styles.box, value[i] ? styles.boxFilled : null]}>
            <Text style={styles.digit}>{value[i] ?? ""}</Text>
          </View>
        ))}
      </TouchableOpacity>
    </View>
  );
}

/** Clears focus helper for parents that reset the code after a failed attempt. */
export type ResendCodeRowProps = {
  seconds: number;
  canResend: boolean;
  sending?: boolean;
  onResend: () => void;
};

export function ResendCodeRow({ seconds, canResend, sending, onResend }: ResendCodeRowProps) {
  return (
    <View style={styles.resendRow}>
      {canResend ? (
        <TouchableOpacity onPress={onResend} disabled={sending} accessibilityRole="button">
          <Text style={styles.resendLink}>{sending ? "Sending..." : "Resend code"}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.resendTimer}>Resend in {seconds}s</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hiddenInput: { position: "absolute", opacity: 0, width: 1, height: 1 },
  row: { flexDirection: "row", gap: 10, justifyContent: "center", marginBottom: 32 },
  box: {
    width: 46,
    height: 60,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
  },
  boxFilled: { borderColor: colors.accent, backgroundColor: "#fff" },
  digit: { fontSize: 24, fontWeight: "600", color: colors.textPrimary },
  resendRow: { alignItems: "center" },
  resendLink: { fontSize: 14, color: colors.accent, fontWeight: "500" },
  resendTimer: { fontSize: 14, color: colors.textMuted },
});
