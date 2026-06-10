import { useQuery } from "@tanstack/react-query";
import { stripeApi } from "@/services/stripe";

export function useGetStripePayoutReady() {
  return useQuery({
    queryKey: ["stripe", "connect", "payout-ready"],
    queryFn: () => stripeApi.isPayoutReady(),
  });
}

export function useGetStripeConnectStatus(accountId: string | undefined) {
  return useQuery({
    queryKey: ["stripe", "connect", "status", accountId],
    queryFn: () => stripeApi.getConnectAccountStatus(accountId!),
    enabled: !!accountId,
  });
}
