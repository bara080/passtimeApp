import type { ExperienceTypeKey } from "@/services/host/types";

export type TransactionStatus = "succeeded" | "pending" | "refunded" | "failed" | "disputed";

/** One transaction as returned by GET /api/payments — a Payment row enriched with
 *  its Booking snapshot. Amounts are in cents. */
export type Transaction = {
  paymentId: string;
  bookingId: string | null;
  transactionId: string | null;
  counterpartyName: string;
  counterpartyPhotoUrl: string | null;
  category: ExperienceTypeKey | null;
  role: "member" | "host";
  /** Headline figure for the viewer: net payout (host) or amount paid (member). */
  amount: number;
  gross: number;
  platformFee: number;
  currency: string;
  status: TransactionStatus;
  statusLabel: string;
  createdAt: string;
  // Breakdown (detail screen); null when the booking is no longer available.
  hourlyRate: number | null;
  durationMinutes: number | null;
  subtotal: number | null;
  serviceFee: number | null;
  total: number;
};

export type TransactionsResponse = { transactions: Transaction[] };
export type TransactionResponse = { transaction: Transaction };
