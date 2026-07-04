import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
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
      const message = err instanceof Error ? err.message : "Failed to send OTP.";
      Alert.alert("Error", message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {!isSignupFlow && (
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1a1a1a" />
          </TouchableOpacity>
        )}

        <Text style={styles.heading}>Verify your phone</Text>
        <Text style={styles.subheading}>
          We'll send a {5}-digit code to confirm your number.
        </Text>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Phone number</Text>
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

        <TouchableOpacity
          style={[styles.ctaButton, sendOtp.isPending && styles.ctaDisabled]}
          onPress={handleSend}
          disabled={sendOtp.isPending}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>
            {sendOtp.isPending ? "Sending..." : "Send code"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  container: {
    flexGrow: 1,
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
    marginBottom: 32,
    lineHeight: 22,
  },
  inputWrapper: { marginBottom: 24 },
  label: {
    fontSize: 16,
    color: "#1a1a1a",
    marginBottom: 6,
  },
  ctaButton: {
    height: 52,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    backgroundColor: "#ff6633",
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
