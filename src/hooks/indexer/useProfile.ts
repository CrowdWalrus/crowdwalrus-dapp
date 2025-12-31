import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
  getProfileByAddress,
  IndexerHttpError,
  type ProfileResponse,
} from "@/services/indexer-services";

export interface UseProfileOptions {
  address: string | null;
  pageSize?: number;
  enabled?: boolean;
}

/** Fetch a profile (with donations+badges) by address using the indexer API. */
export function useProfile(
  options: UseProfileOptions,
): UseQueryResult<ProfileResponse | null, Error> {
  const { address, pageSize = 20, enabled = true } = options;

  return useQuery<ProfileResponse | null, Error>({
    queryKey: ["indexer", "profile", address, pageSize],
    queryFn: async () => {
      if (!address) {
        return null;
      }

      try {
        return await getProfileByAddress({ address, pageSize });
      } catch (error) {
        if (error instanceof IndexerHttpError && error.status === 404) {
          return null;
        }
        throw error as Error;
      }
    },
    enabled: Boolean(enabled && address),
    staleTime: 5_000,
    gcTime: 5 * 60_000,
  });
}
