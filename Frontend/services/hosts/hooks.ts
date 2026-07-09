import { useQuery } from "@tanstack/react-query";
import { hostsApi } from "./index";
import type { DiscoverParams } from "./types";

const STALE_MS = 5 * 60 * 1000;

/** Host cards for one home section. Key includes every filter so sections cache independently. */
export function useDiscoverHosts(params: DiscoverParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["hosts", params.section, params.category ?? null, params.city ?? null, params.offset ?? 0],
    queryFn: () => hostsApi.discover(params),
    staleTime: STALE_MS,
    enabled: options?.enabled ?? true,
    select: (data) => data.hosts,
  });
}
