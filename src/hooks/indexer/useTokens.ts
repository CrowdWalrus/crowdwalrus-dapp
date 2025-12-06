import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { getTokens, type TokenResponse } from "@/services/indexer-services";

export interface UseTokensOptions {
  enabled?: boolean;
}

/** Simple query for the current enabled token list. */
export function useTokens(
  options: UseTokensOptions = {},
): UseQueryResult<TokenResponse[], Error> {
  const { enabled = true } = options;

  return useQuery<TokenResponse[], Error>({
    queryKey: ["indexer", "tokens"],
    queryFn: () => getTokens(),
    enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
