import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from "@tanstack/react-query";

import {
  getProfileDonations,
  type PaginatedResponse,
  type ProfileDonationResponse,
} from "@/services/indexer-services";

export interface UseProfileDonationsOptions {
  pageSize?: number;
  enabled?: boolean;
}

/** Infinite-query for profile donation pages. */
export function useProfileDonations(
  ownerAddress: string | null,
  options: UseProfileDonationsOptions = {},
): UseInfiniteQueryResult<
  InfiniteData<PaginatedResponse<ProfileDonationResponse>>, 
  Error
> {
  const { pageSize = 20, enabled = true } = options;

  return useInfiniteQuery<PaginatedResponse<ProfileDonationResponse>, Error>({
    queryKey: ["indexer", "profile-donations", ownerAddress, pageSize],
    queryFn: ({ pageParam }) => {
      const page = typeof pageParam === "number" ? pageParam : 1;
      if (!ownerAddress) {
        return Promise.resolve({
          data: [],
          page,
          pageSize,
          hasMore: false,
          totalCount: 0,
        });
      }

      return getProfileDonations({
        address: ownerAddress,
        page,
        pageSize,
      });
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled: Boolean(enabled && ownerAddress),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
