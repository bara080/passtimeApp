import { useQuery } from "@tanstack/react-query";
import { hostDashboardApi } from "./index";

const STALE_MS = 30 * 1000;

/** One-round-trip host dashboard aggregation.
 *  Refetches on focus so hosts returning to the app see fresh earnings + new
 *  pending requests without a manual pull. */
export function useHostDashboard(enabled: boolean) {
  return useQuery({
    queryKey: ["host", "dashboard"],
    queryFn: hostDashboardApi.get,
    enabled,
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
  });
}
