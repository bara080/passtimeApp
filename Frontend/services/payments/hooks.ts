import { useQuery } from "@tanstack/react-query";
import { paymentsApi } from "./index";

const STALE_MS = 60 * 1000;

/** The requester's transactions (member charges or host earnings). */
export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: () => paymentsApi.list(),
    staleTime: STALE_MS,
    select: (data) => data.transactions,
  });
}

/** One transaction with the full fee breakdown. */
export function useTransaction(paymentId: string | null) {
  return useQuery({
    queryKey: ["transactions", paymentId],
    queryFn: () => paymentsApi.detail(paymentId!),
    enabled: Boolean(paymentId),
    staleTime: STALE_MS,
    select: (data) => data.transaction,
  });
}
