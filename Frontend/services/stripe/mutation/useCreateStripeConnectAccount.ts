import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stripeApi } from "@/services/stripe";

export function useCreateStripeConnectAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => stripeApi.createConnectAccount(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stripe", "connect", "status"] });
    },
  });
}
