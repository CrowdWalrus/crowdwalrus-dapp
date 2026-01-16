import {
  useInfiniteQuery,
  type UseInfiniteQueryResult,
  type InfiniteData,
} from "@tanstack/react-query";

import {
  getCampaignById,
  getCampaigns,
  type CampaignVerificationStatus,
  type CampaignDetail,
  type CampaignSummary,
} from "@/services/indexer-services";

export interface CampaignsPage {
  summaries: CampaignSummary[];
  details: CampaignDetail[];
  page: number;
  pageSize: number;
  hasMore: boolean;
  totalCount: number;
}

export interface UseCampaignsOptions {
  pageSize?: number;
  verified?: boolean;
  verificationStatus?: CampaignVerificationStatus;
  hydrateDetails?: boolean;
  enabled?: boolean;
  ownerAddress?: string | null;
}

const DEFAULT_PAGE_SIZE = 20;

/**
 * Infinite-query wrapper for paginated campaign summaries (and optional detail hydration).
 */
export function useCampaigns(
  options: UseCampaignsOptions = {},
): UseInfiniteQueryResult<InfiniteData<CampaignsPage>, Error> {
  const {
    pageSize = DEFAULT_PAGE_SIZE,
    verified = false,
    verificationStatus,
    hydrateDetails = true,
    enabled = true,
    ownerAddress = null,
  } = options;
  const resolvedStatus = verificationStatus ?? (verified ? "verified" : "all");

  return useInfiniteQuery<CampaignsPage, Error>({
    queryKey: [
      "indexer",
      "campaigns",
      { pageSize, verificationStatus: resolvedStatus, hydrateDetails, ownerAddress },
    ],
    queryFn: async ({ pageParam }) => {
      const page = typeof pageParam === "number" ? pageParam : 1;
      const response = await getCampaigns({
        page,
        pageSize,
        verificationStatus: resolvedStatus,
        ownerAddress: ownerAddress ?? undefined,
      });

      if (!hydrateDetails) {
        return {
          summaries: response.data,
          details: [],
          page: response.page,
          pageSize: response.pageSize,
          hasMore: response.hasMore,
          totalCount: response.totalCount,
        } satisfies CampaignsPage;
      }

      const details = await Promise.all(
        response.data.map(async (summary) => {
          try {
            return await getCampaignById(summary.campaignId);
          } catch (error) {
            console.warn(
              `[useCampaigns] Failed to hydrate campaign ${summary.campaignId}`,
              error,
            );
            return null;
          }
        }),
      );

      return {
        summaries: response.data,
        details: details.filter(
          (entry): entry is CampaignDetail => Boolean(entry),
        ),
        page: response.page,
        pageSize: response.pageSize,
        hasMore: response.hasMore,
        totalCount: response.totalCount,
      } satisfies CampaignsPage;
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
