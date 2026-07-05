import { useState } from "react";
import { Alert, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AuthScreen, AuthTitle, OtpCodeInput, ResendCodeRow, GradientButton } from "@/components/auth";
import { authApi } from "@/services/auth";
import { useOtpTimer } from "@/hooks/useOtpTimer";

const OTP_LENGTH = 6;

function maskEmail(email: string): string {
  return email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(Math.min(b.length, 5)) + c);
}

export default function ForgotPasswordVerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const { seconds, canResend, restart } = useOtpTimer();

  const handleVerify = async (digits: string) => {
    if (digits.length !== OTP_LENGTH) return;
    setVerifying(true);
    try {
      const { uid } = await authApi.verifyResetCode(email ?? "", digits);
      router.replace({ pathname: "/(auth)/reset-password", params: { uid } });
    } catch (err: unknown) {
      Alert.alert("Verification failed", err instanceof Error ? err.message : "Invalid code.");
      setCode("");
    } finally {
      setVerifying(false);
    }
  };

  const handleChange = (digits: string) => {
    setCode(digits);
    if (digits.length === OTP_LENGTH) handleVerify(digits);
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
    <AuthScreen>
      <AuthTitle
        title="Enter verification code"
        description={`We send verification code to your email ${maskEmail(email ?? "")}. You can check your inbox.`}
      />

      <View className="flex-1 justify-center">
        <OtpCodeInput length={OTP_LENGTH} value={code} onChangeText={handleChange} />
        <ResendCodeRow seconds={seconds} canResend={canResend} onResend={handleResend} />
      </View>

      <GradientButton
        label="Verify Code"
        onPress={() => handleVerify(code)}
        loading={verifying}
        disabled={code.length !== OTP_LENGTH}
      />
    </AuthScreen>
  );
}
