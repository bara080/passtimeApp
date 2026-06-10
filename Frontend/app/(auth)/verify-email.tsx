import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import {
  useSendVerifyEmailMutation,
  useVerifyEmailCodeMutation,
} from "@/hooks/useSendVerifyEmail";
import { useOtpTimer } from "@/hooks/useOtpTimer";
import { EMAIL_OTP_LENGTH } from "@/constants/phoneOtpLength";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email, displayName } = useLocalSearchParams<{ email: string; displayName?: string }>();
  const [code, setCode] = useState("");
  const inputRef = useRef<TextInput>(null);

  const sendVerifyEmail = useSendVerifyEmailMutation();
  const verifyEmailCode = useVerifyEmailCodeMutation();
  const { seconds, canResend, restart } = useOtpTimer();

  const handleChange = async (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, EMAIL_OTP_LENGTH);
    setCode(digits);

    if (digits.length === EMAIL_OTP_LENGTH) {
      try {
        await verifyEmailCode.mutateAsync({ email: email ?? "", code: digits });
        router.back();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Invalid code.";
        Alert.alert("Verification failed", message);
        setCode("");
        inputRef.current?.focus();
      }
    }
  };

  const handleResend = async () => {
    if (!canResend || !email) return;
    try {
      await sendVerifyEmail.mutateAsync({ email, displayName });
      restart();
      setCode("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to resend.";
      Alert.alert("Error", message);
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + b.replace(/./g, "•") + c)
    : "";

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>

        <Text style={styles.heading}>Verify your email</Text>
        <Text style={styles.subheading}>
          We sent a {EMAIL_OTP_LENGTH}-digit code to {maskedEmail}
        </Text>

        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={code}
          onChangeText={handleChange}
          keyboardType="number-pad"
          maxLength={EMAIL_OTP_LENGTH}
          autoFocus
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          caretHidden
        />

        <TouchableOpacity style={styles.dotRow} onPress={() => inputRef.current?.focus()} activeOpacity={1}>
          {Array.from({ length: EMAIL_OTP_LENGTH }).map((_, i) => (
            <View key={i} style={[styles.dot, code[i] ? styles.dotFilled : null]}>
              <Text style={styles.dotText}>{code[i] ?? ""}</Text>
            </View>
          ))}
        </TouchableOpacity>

        <View style={styles.resendRow}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend} disabled={sendVerifyEmail.isPending}>
              <Text style={styles.resendLink}>
                {sendVerifyEmail.isPending ? "Sending..." : "Resend code"}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.resendTimer}>Resend in {seconds}s</Text>
          )}
        </View>

        {verifyEmailCode.isPending && (
          <Text style={styles.verifyingText}>Verifying…</Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  container: {
    flex: 1,
    paddingTop: 79,
    paddingHorizontal: 21,
    paddingBottom: 32,
  },
  backButton: { marginBottom: 32 },
  heading: {
    fontSize: 26,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    color: "#6b6b6b",
    marginBottom: 40,
    lineHeight: 22,
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
  dotRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginBottom: 32,
  },
  dot: {
    width: 46,
    height: 60,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#d1d5dc",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
  },
  dotFilled: {
    borderColor: "#ff6633",
    backgroundColor: "#fff",
  },
  dotText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  resendRow: {
    alignItems: "center",
  },
  resendLink: {
    fontSize: 14,
    color: "#ff6633",
    fontWeight: "500",
  },
  resendTimer: {
    fontSize: 14,
    color: "#6b6b6b",
  },
  verifyingText: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 14,
    color: "#6b6b6b",
  },
});
