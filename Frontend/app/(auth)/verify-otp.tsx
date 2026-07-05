import { useState } from "react";
import { Alert, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AuthScreen, AuthTitle, OtpCodeInput, ResendCodeRow, GradientButton } from "@/components/auth";
import { useVerifyOtpMutation, useSendOtpMutation } from "@/hooks/useSendOtp";
import { useOtpTimer } from "@/hooks/useOtpTimer";
import { PHONE_OTP_LENGTH } from "@/constants/phoneOtpLength";
import { useAuth } from "@/context/AuthProvider";

function maskPhone(phone: string): string {
  return phone.length > 4 ? phone.slice(0, 5) + "****" + phone.slice(-3) : phone;
}

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { phoneNumber, flow } = useLocalSearchParams<{ phoneNumber: string; flow?: string }>();
  const isSignupFlow = flow === "signup";
  const { updateUser } = useAuth();
  const [code, setCode] = useState("");

  const verifyOtp = useVerifyOtpMutation();
  const sendOtp = useSendOtpMutation();
  const { seconds, canResend, restart } = useOtpTimer();

  const handleVerify = async (digits: string) => {
    if (digits.length !== PHONE_OTP_LENGTH) return;
    try {
      await verifyOtp.mutateAsync({ phoneNumber: phoneNumber ?? "", code: digits });
      await updateUser({ phoneVerified: true, phoneNumber: phoneNumber ?? undefined });
      if (isSignupFlow) {
        router.replace({
          pathname: "/(auth)/success",
          params: {
            title: "Success",
            message: "Your OTP has been successfully verified. You’re just last step away.",
            next: "/(auth)/profile-details",
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
    if (digits.length === PHONE_OTP_LENGTH) handleVerify(digits);
  };

  const handleResend = async () => {
    if (!canResend || !phoneNumber) return;
    try {
      await sendOtp.mutateAsync({ phoneNumber });
      restart();
      setCode("");
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to resend.");
    }
  };

  return (
    <AuthScreen>
      <AuthTitle
        title="Enter One Time Password"
        description={`We send OTP to your mobile ${maskPhone(phoneNumber ?? "")}. You can check your SMS.`}
      />

      <View className="flex-1 justify-center">
        <OtpCodeInput length={PHONE_OTP_LENGTH} value={code} onChangeText={handleChange} autoComplete="sms-otp" />
        <ResendCodeRow seconds={seconds} canResend={canResend} sending={sendOtp.isPending} onResend={handleResend} />
      </View>

      <GradientButton
        label="Verify OTP"
        onPress={() => handleVerify(code)}
        loading={verifyOtp.isPending}
        disabled={code.length !== PHONE_OTP_LENGTH}
      />
    </AuthScreen>
  );
}
