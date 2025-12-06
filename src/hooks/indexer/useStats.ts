import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { getIndexerStats, type StatsResponse } from "@/services/indexer-services";

export interface UseStatsOptions {
  enabled?: boolean;
}

/** Fetch deployment stats (checkpoint lag, totals). */
export function useStats(
  options: UseStatsOptions = {},
): UseQueryResult<StatsResponse, Error> {
  const { enabled = true } = options;

  return useQuery<StatsResponse, Error>({
    queryKey: ["indexer", "stats"],
    queryFn: () => getIndexerStats(),
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
