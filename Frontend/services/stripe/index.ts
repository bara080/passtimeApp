import { axiosInstance } from "@/utils/httpClient";
import type {
  StripeConnectStatus,
  ConnectOnboardingResponse,
  PaymentIntentPayload,
  PaymentIntentResponse,
} from "./types";

export const stripeApi = {
  createConnectAccount: async (): Promise<ConnectOnboardingResponse> => {
    const res = await axiosInstance.post("/stripe/connect/onboard");
    if (res.data.status !== 0) throw new Error(res.data.message);
    return res.data.data;
  },

  getConnectAccountStatus: async (accountId: string): Promise<StripeConnectStatus> => {
    const res = await axiosInstance.get(`/stripe/connect/status/${accountId}`);
    if (res.data.status !== 0) throw new Error(res.data.message);
    return res.data.data;
  },

  isPayoutReady: async (): Promise<{ payoutReady: boolean }> => {
    const res = await axiosInstance.get("/stripe/connect/payout-ready");
    if (res.data.status !== 0) throw new Error(res.data.message);
    return res.data.data;
  },

  refreshOnboardingLink: async (): Promise<{ onboardingUrl: string }> => {
    const res = await axiosInstance.post("/stripe/connect/onboarding-link");
    if (res.data.status !== 0) throw new Error(res.data.message);
    return res.data.data;
  },

  createPaymentIntent: async (payload: PaymentIntentPayload): Promise<PaymentIntentResponse> => {
    const res = await axiosInstance.post("/stripe/payment-intent", payload);
    if (res.data.status !== 0) throw new Error(res.data.message);
    return res.data.data;
  },
};
