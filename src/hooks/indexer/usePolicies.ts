import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { getPolicies, type PolicyResponse } from "@/services/indexer-services";

export interface UsePoliciesOptions {
  enabled?: boolean;
}

/** Fetch enabled payout policies. */
export function usePolicies(
  options: UsePoliciesOptions = {},
): UseQueryResult<PolicyResponse[], Error> {
  const { enabled = true } = options;

  return useQuery<PolicyResponse[], Error>({
    queryKey: ["indexer", "policies"],
    queryFn: () => getPolicies(),
    enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
