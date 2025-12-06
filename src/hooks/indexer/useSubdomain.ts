import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
  getSubdomainByName,
  IndexerHttpError,
  type SubdomainResponse,
} from "@/services/indexer-services";

export interface UseSubdomainOptions {
  enabled?: boolean;
}

/** Resolve a subdomain record; returns null on 404. */
export function useSubdomain(
  name: string | null,
  options: UseSubdomainOptions = {},
): UseQueryResult<SubdomainResponse | null, Error> {
  const { enabled = true } = options;

  return useQuery<SubdomainResponse | null, Error>({
    queryKey: ["indexer", "subdomain", name],
    queryFn: async () => {
      if (!name) return null;
      try {
        return await getSubdomainByName(name);
      } catch (error) {
        if (error instanceof IndexerHttpError && error.status === 404) {
          return null;
        }
        throw error as Error;
      }
    },
    enabled: Boolean(enabled && name),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
