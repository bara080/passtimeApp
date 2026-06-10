import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { authApi } from "@/services/auth";
import { useOtpTimer } from "@/hooks/useOtpTimer";

const OTP_LENGTH = 6;

export default function ForgotPasswordVerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { seconds, canResend, restart } = useOtpTimer();

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + b.replace(/./g, "•") + c)
    : "";

  const handleChange = async (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, OTP_LENGTH);
    setCode(digits);

    if (digits.length === OTP_LENGTH) {
      setVerifying(true);
      try {
        const { uid } = await authApi.verifyResetCode(email ?? "", digits);
        router.replace({ pathname: "/(auth)/reset-password", params: { uid } });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Invalid code.";
        Alert.alert("Verification failed", message);
        setCode("");
        inputRef.current?.focus();
      } finally {
        setVerifying(false);
      }
    }
  };

  const handleResend = async () => {
    if (!canResend || !email) return;
    try {
      await authApi.forgotPassword(email);
      restart();
      setCode("");
    } catch {
      Alert.alert("Error", "Failed to resend. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </Pressable>

        <Text style={styles.heading}>Enter your code</Text>
        <Text style={styles.subheading}>
          We sent a {OTP_LENGTH}-digit code to {maskedEmail}
        </Text>

        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={code}
          onChangeText={handleChange}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          autoFocus
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          caretHidden
          editable={!verifying}
        />

        <Pressable
          style={styles.dotRow}
          onPress={() => inputRef.current?.focus()}
        >
          {Array.from({ length: OTP_LENGTH }).map((_, i) => (
            <View key={i} style={[styles.dot, code[i] ? styles.dotFilled : null]}>
              <Text style={styles.dotText}>{code[i] ?? ""}</Text>
            </View>
          ))}
        </Pressable>

        {verifying ? (
          <ActivityIndicator color="#ff6633" style={{ marginTop: 8 }} />
        ) : (
          <View style={styles.resendRow}>
            {canResend ? (
              <Pressable onPress={handleResend}>
                <Text style={styles.resendLink}>Resend code</Text>
              </Pressable>
            ) : (
              <Text style={styles.resendTimer}>Resend in {seconds}s</Text>
            )}
          </View>
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
  heading: { fontSize: 26, fontWeight: "600", color: "#1a1a1a", marginBottom: 8 },
  subheading: { fontSize: 16, color: "#6b6b6b", marginBottom: 40, lineHeight: 22 },
  hiddenInput: { position: "absolute", opacity: 0, width: 1, height: 1 },
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
  dotFilled: { borderColor: "#ff6633", backgroundColor: "#fff" },
  dotText: { fontSize: 24, fontWeight: "600", color: "#1a1a1a" },
  resendRow: { alignItems: "center" },
  resendLink: { fontSize: 14, color: "#ff6633", fontWeight: "500" },
  resendTimer: { fontSize: 14, color: "#6b6b6b" },
});
