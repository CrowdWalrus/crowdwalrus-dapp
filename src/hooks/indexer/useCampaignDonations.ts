import {
  useInfiniteQuery,
  type UseInfiniteQueryResult,
  type InfiniteData,
} from "@tanstack/react-query";

import {
  getCampaignDonations,
  type DonationResponse,
  type PaginatedResponse,
} from "@/services/indexer-services";

export interface UseCampaignDonationsOptions {
  pageSize?: number;
  enabled?: boolean;
  refetchIntervalMs?: number | false;
}

/** Infinite-query for campaign donation pages. */
export function useCampaignDonations(
  campaignId: string | null,
  options: UseCampaignDonationsOptions = {},
): UseInfiniteQueryResult<InfiniteData<PaginatedResponse<DonationResponse>>, Error> {
  const { pageSize = 20, enabled = true, refetchIntervalMs } = options;

  return useInfiniteQuery<PaginatedResponse<DonationResponse>, Error>({
    queryKey: ["indexer", "campaign-donations", campaignId, pageSize],
    queryFn: ({ pageParam }) => {
      const page = typeof pageParam === "number" ? pageParam : 1;
      if (!campaignId) {
        return Promise.resolve({
          data: [],
          page,
          pageSize,
          hasMore: false,
        });
      }
      return getCampaignDonations({ id: campaignId, page, pageSize });
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled: Boolean(enabled && campaignId),
    refetchInterval: refetchIntervalMs,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
