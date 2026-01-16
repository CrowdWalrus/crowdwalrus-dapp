import { useQuery } from "@tanstack/react-query";

import {
  getProfileDonations,
  type PaginatedResponse,
  type ProfileDonationResponse,
} from "@/services/indexer-services";

export interface UseProfileDonationsPageOptions {
  page: number;
  pageSize?: number;
  enabled?: boolean;
}

const DEFAULT_PAGE_SIZE = 20;

export function profileDonationsPageQueryKey(
  ownerAddress: string,
  page: number,
  pageSize: number,
) {
  return [
    "indexer",
    "profile-donations",
    ownerAddress,
    { page, pageSize },
  ] as const;
}

export function fetchProfileDonationsPage(
  ownerAddress: string,
  page: number,
  pageSize: number,
): Promise<PaginatedResponse<ProfileDonationResponse>> {
  return getProfileDonations({ address: ownerAddress, page, pageSize });
}

/** Page-based profile donations query (preferred for numbered pagination). */
export function useProfileDonationsPage(
  ownerAddress: string | null,
  options: UseProfileDonationsPageOptions,
) {
  const { page, enabled = true } = options;
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;

  return useQuery<PaginatedResponse<ProfileDonationResponse>, Error>({
    queryKey: ownerAddress
      ? profileDonationsPageQueryKey(ownerAddress, page, pageSize)
      : ["indexer", "profile-donations", null, { page, pageSize }],
    queryFn: () =>
      ownerAddress
        ? fetchProfileDonationsPage(ownerAddress, page, pageSize)
        : Promise.resolve({
            data: [],
            page,
            pageSize,
            hasMore: false,
            totalCount: 0,
          }),
    enabled: Boolean(enabled && ownerAddress),
    placeholderData: (previousData, previousQuery) => {
      if (!previousData || !previousQuery || !ownerAddress) {
        return undefined;
      }

      const prevKey = previousQuery.queryKey as readonly unknown[] | undefined;
      const prevOwnerAddress = prevKey?.[2];
      const prevParams = prevKey?.[3] as { pageSize?: number } | undefined;
      const prevPageSize = prevParams?.pageSize ?? DEFAULT_PAGE_SIZE;

      if (prevOwnerAddress !== ownerAddress || prevPageSize !== pageSize) {
        return undefined;
      }

      return previousData;
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
