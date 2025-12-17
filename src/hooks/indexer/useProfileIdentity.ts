import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
  getProfileIdentityByAddress,
  IndexerHttpError,
  type ProfileIdentityResponse,
} from "@/services/indexer-services";

export interface UseProfileIdentityOptions {
  address: string | null;
  enabled?: boolean;
}

/** Fetch a profile identity (owner + optional registered sub-name) by address. */
export function useProfileIdentity(
  options: UseProfileIdentityOptions,
): UseQueryResult<ProfileIdentityResponse | null, Error> {
  const { address, enabled = true } = options;

  return useQuery<ProfileIdentityResponse | null, Error>({
    queryKey: ["indexer", "profile-identity", address],
    queryFn: async () => {
      if (!address) {
        return null;
      }

      try {
        return await getProfileIdentityByAddress(address);
      } catch (error) {
        if (error instanceof IndexerHttpError && error.status === 404) {
          return null;
        }
        throw error as Error;
      }
    },
    enabled: Boolean(enabled && address),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

