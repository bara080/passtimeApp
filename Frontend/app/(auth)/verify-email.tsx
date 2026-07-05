import { useState } from "react";
import { Alert, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AuthScreen, AuthTitle, OtpCodeInput, ResendCodeRow, GradientButton } from "@/components/auth";
import { useSendVerifyEmailMutation, useVerifyEmailCodeMutation } from "@/hooks/useSendVerifyEmail";
import { useOtpTimer } from "@/hooks/useOtpTimer";
import { EMAIL_OTP_LENGTH } from "@/constants/phoneOtpLength";
import { useAuth } from "@/context/AuthProvider";

function maskEmail(email: string): string {
  return email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(Math.min(b.length, 5)) + c);
}

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email, flow } = useLocalSearchParams<{ email: string; displayName?: string; flow?: string }>();
  const isSignupFlow = flow === "signup";
  const { updateUser } = useAuth();
  const [code, setCode] = useState("");

  const sendVerifyEmail = useSendVerifyEmailMutation();
  const verifyEmailCode = useVerifyEmailCodeMutation();
  const { seconds, canResend, restart } = useOtpTimer();

  const handleVerify = async (digits: string) => {
    if (digits.length !== EMAIL_OTP_LENGTH) return;
    try {
      await verifyEmailCode.mutateAsync({ email: email ?? "", code: digits });
      await updateUser({ emailVerified: true });
      if (isSignupFlow) {
        router.replace({
          pathname: "/(auth)/success",
          params: {
            title: "Success",
            message:
              "Your email has been successfully verified. Please verify your mobile number to complete the account.",
            next: "/(auth)/verify-phone",
            nextParams: JSON.stringify({ flow: "signup" }),
          },
        });
      } else {
        router.back();
      }
    } catch (err: unknown) {
      Alert.alert("Verification failed", err instanceof Error ? err.message : "Invalid code.");
      setCode("");
    }
  };

  const handleChange = (digits: string) => {
    setCode(digits);
    if (digits.length === EMAIL_OTP_LENGTH) handleVerify(digits);
  };

  const handleResend = async () => {
    if (!canResend || !email) return;
    try {
      await sendVerifyEmail.mutateAsync({ email });
      restart();
      setCode("");
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to resend.");
    }
  };

  return (
    <AuthScreen showBack={!isSignupFlow}>
      <AuthTitle
        title="Enter verification code"
        description={`We send verification code to your email ${maskEmail(email ?? "")}. You can check your inbox or spam/junk folder.`}
      />

      <View className="flex-1 justify-center">
        <OtpCodeInput length={EMAIL_OTP_LENGTH} value={code} onChangeText={handleChange} />
        <ResendCodeRow
          seconds={seconds}
          canResend={canResend}
          sending={sendVerifyEmail.isPending}
          onResend={handleResend}
        />
      </View>

      <GradientButton
        label="Verify Code"
        onPress={() => handleVerify(code)}
        loading={verifyEmailCode.isPending}
        disabled={code.length !== EMAIL_OTP_LENGTH}
      />
    </AuthScreen>
  );
}
