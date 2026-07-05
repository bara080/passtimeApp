import { useState } from "react";
import { Alert, View, Text } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AuthScreen, AuthTitle, GradientButton } from "@/components/auth";
import PhoneInput from "@/components/form/PhoneInput";
import { useSendOtpMutation } from "@/hooks/useSendOtp";
import { isValidPhoneNumber, toE164FromCallingCodeAndNational, type CountryCode } from "@/utils/phone";

export default function VerifyPhoneScreen() {
  const router = useRouter();
  const { flow } = useLocalSearchParams<{ flow?: string }>();
  const isSignupFlow = flow === "signup";

  const [callingCode, setCallingCode] = useState("1");
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("US");
  const [nationalNumber, setNationalNumber] = useState("");
  const [error, setError] = useState("");

  const sendOtp = useSendOtpMutation();

  const handleSend = async () => {
    setError("");
    if (!isValidPhoneNumber(nationalNumber, selectedCountry)) {
      setError("Please enter a valid phone number.");
      return;
    }
    const e164 = toE164FromCallingCodeAndNational(callingCode, nationalNumber);
    if (!e164) {
      setError("Could not parse phone number.");
      return;
    }
    try {
      await sendOtp.mutateAsync({ phoneNumber: e164 });
      router.push({
        pathname: "/(auth)/verify-otp",
        params: { phoneNumber: e164, ...(isSignupFlow ? { flow: "signup" } : {}) },
      });
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to send OTP.");
    }
  };

  return (
    <AuthScreen showBack={!isSignupFlow}>
      <AuthTitle title="Enter your mobile number" subtitle="Pick your country and enter your number" />

      <View className="flex-1 justify-center">
        <Text className="text-base text-black mb-2">Mobile number</Text>
        <PhoneInput
          value={nationalNumber}
          onChangeText={setNationalNumber}
          callingCode={callingCode}
          onCallingCodeChange={(code, country) => {
            setCallingCode(code);
            setSelectedCountry(country);
          }}
          selectedCountry={selectedCountry}
          error={error}
        />
      </View>

      <GradientButton label="Send OTP" onPress={handleSend} loading={sendOtp.isPending} />
    </AuthScreen>
  );
}
