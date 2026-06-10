import { axiosInstance } from "@/utils/httpClient";
import type { CreatePaymentIntentPayload } from "./types";
import type { PaymentIntentResponse } from "@/services/stripe/types";

export const paymentsApi = {
  createPaymentIntent: async (
    payload: CreatePaymentIntentPayload
  ): Promise<PaymentIntentResponse> => {
    const res = await axiosInstance.post("/stripe/payment-intent", payload);
    if (res.data.status !== 0) throw new Error(res.data.message);
    return res.data.data;
  },
};
