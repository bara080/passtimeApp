import { useState, useCallback } from "react";
import { useStripe } from "@stripe/stripe-react-native";
import { paymentsApi } from "@/services/payment";
import type { CreatePaymentIntentPayload } from "@/services/payment/types";

type UseStripePaymentSheetOptions = {
  merchantDisplayName?: string;
};

export function useStripePaymentSheet({
  merchantDisplayName = "Passtime",
}: UseStripePaymentSheetOptions = {}) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = useCallback(
    async (payload: CreatePaymentIntentPayload) => {
      setIsLoading(true);
      setError(null);

      try {
        const { clientSecret, paymentIntentId, platformFee } =
          await paymentsApi.createPaymentIntent(payload);

        const { error: initError } = await initPaymentSheet({
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName,
          applePay: { merchantCountryCode: "US" },
          googlePay: { merchantCountryCode: "US", testEnv: __DEV__ },
          style: "automatic",
        });

        if (initError) {
          setError(initError.message);
          return { success: false, error: initError.message };
        }

        const { error: presentError } = await presentPaymentSheet();

        if (presentError) {
          if (presentError.code === "Canceled") {
            return { success: false, canceled: true };
          }
          setError(presentError.message);
          return { success: false, error: presentError.message };
        }

        return { success: true, paymentIntentId, platformFee };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Payment failed.";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [initPaymentSheet, presentPaymentSheet, merchantDisplayName]
  );

  return { pay, isLoading, error };
}
