import {
  useInfiniteQuery,
  type UseInfiniteQueryResult,
  type InfiniteData,
} from "@tanstack/react-query";

import {
  getCampaignUpdates,
  type CampaignUpdateResponse,
  type PaginatedResponse,
} from "@/services/indexer-services";

export interface UseCampaignUpdatesOptions {
  pageSize?: number;
  enabled?: boolean;
}

/** Infinite-query for campaign updates with page/size pagination. */
export function useCampaignUpdates(
  campaignId: string | null,
  options: UseCampaignUpdatesOptions = {},
): UseInfiniteQueryResult<InfiniteData<PaginatedResponse<CampaignUpdateResponse>>, Error> {
  const { pageSize = 20, enabled = true } = options;

  return useInfiniteQuery<PaginatedResponse<CampaignUpdateResponse>, Error>({
    queryKey: ["indexer", "campaign-updates", campaignId, pageSize],
    queryFn: ({ pageParam }) => {
      const page = typeof pageParam === "number" ? pageParam : 1;
      if (!campaignId) {
        return Promise.resolve({
          data: [],
          page,
          pageSize,
          hasMore: false,
          totalCount: 0,
        });
      }
      return getCampaignUpdates({ id: campaignId, page, pageSize });
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled: Boolean(enabled && campaignId),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
