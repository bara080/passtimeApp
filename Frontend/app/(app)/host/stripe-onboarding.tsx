"use client";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ArrowLeft, ExternalLink, CheckCircle } from "lucide-react-native";
import { useCreateStripeConnectAccount } from "@/services/stripe/mutation/useCreateStripeConnectAccount";
import { useGetStripePayoutReady } from "@/services/stripe/query/useGetStripeStatus";
import { useQueryClient } from "@tanstack/react-query";

export default function StripeOnboardingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);

  const createAccount = useCreateStripeConnectAccount();
  const { data: payoutStatus, isLoading: checkingStatus } = useGetStripePayoutReady();

  useEffect(() => {
    if (!onboardingUrl) {
      initOnboarding();
    }
  }, []);

  const initOnboarding = async () => {
    try {
      const result = await createAccount.mutateAsync();
      setOnboardingUrl(result.onboardingUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not start onboarding.";
      Alert.alert("Error", message);
    }
  };

  const handleOpenOnboarding = async () => {
    if (!onboardingUrl) return;

    const result = await WebBrowser.openAuthSessionAsync(onboardingUrl);

    if (result.type === "success" || result.type === "dismiss") {
      queryClient.invalidateQueries({ queryKey: ["stripe", "connect"] });
    }
  };

  if (checkingStatus || createAccount.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff6633" />
        <Text style={styles.loadingText}>Setting up your payout account…</Text>
      </View>
    );
  }

  if (payoutStatus?.payoutReady) {
    return (
      <View style={styles.center}>
        <CheckCircle size={64} color="#99cc33" />
        <Text style={styles.successHeading}>Payouts enabled</Text>
        <Text style={styles.successBody}>
          Your Stripe account is verified and ready to receive payments.
        </Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => router.back()}>
          <Text style={styles.ctaText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft size={24} color="#1a1a1a" />
      </TouchableOpacity>

      <Text style={styles.heading}>Set up payouts</Text>
      <Text style={styles.body}>
        To receive earnings from bookings, you need to connect a Stripe account. This takes about 5
        minutes.
      </Text>

      <View style={styles.bulletList}>
        {["Bank account or debit card", "Identity verification", "Tax information"].map((item) => (
          <View key={item} style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.ctaButton, !onboardingUrl && styles.ctaDisabled]}
        onPress={handleOpenOnboarding}
        disabled={!onboardingUrl}
        activeOpacity={0.85}
      >
        <ExternalLink size={18} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.ctaText}>Continue to Stripe</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b6b6b",
    marginTop: 8,
  },
  successHeading: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 8,
  },
  successBody: {
    fontSize: 16,
    color: "#6b6b6b",
    textAlign: "center",
    lineHeight: 22,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 79,
    paddingHorizontal: 21,
    paddingBottom: 32,
  },
  backButton: { marginBottom: 32 },
  heading: {
    fontSize: 26,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    color: "#6b6b6b",
    lineHeight: 22,
    marginBottom: 24,
  },
  bulletList: {
    marginBottom: 40,
    gap: 10,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  bullet: {
    fontSize: 16,
    color: "#ff6633",
    lineHeight: 22,
  },
  bulletText: {
    fontSize: 16,
    color: "#1a1a1a",
    lineHeight: 22,
  },
  ctaButton: {
    height: 52,
    borderRadius: 8,
    backgroundColor: "#ff6633",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
