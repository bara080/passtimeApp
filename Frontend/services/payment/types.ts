export type Payment = {
  id: string;
  memberUid: string;
  hostUid: string;
  bookingId: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  platformFee: number;
  status: "pending" | "succeeded" | "failed" | "refunded";
  createdAt: string;
};

export type CreatePaymentIntentPayload = {
  hostUid: string;
  amount: number;
  currency?: string;
  bookingId: string;
  metadata?: Record<string, string>;
};
