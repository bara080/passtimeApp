export type StripeConnectStatus = {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  payoutReady: boolean;
};

export type ConnectOnboardingPayload = {
  hostUid: string;
};

export type ConnectOnboardingResponse = {
  onboardingUrl: string;
  accountId: string;
};

export type PaymentIntentPayload = {
  hostUid: string;
  amount: number;
  currency?: string;
  bookingId: string;
  metadata?: Record<string, string>;
};

export type PaymentIntentResponse = {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  platformFee: number;
};
