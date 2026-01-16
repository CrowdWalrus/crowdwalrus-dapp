import { useQuery } from "@tanstack/react-query";

import {
  getCampaignDonations,
  type DonationResponse,
  type PaginatedResponse,
} from "@/services/indexer-services";

export interface UseCampaignDonationsPageOptions {
  page: number;
  pageSize?: number;
  enabled?: boolean;
  refetchIntervalMs?: number | false;
}

const DEFAULT_PAGE_SIZE = 20;

export function campaignDonationsPageQueryKey(
  campaignId: string,
  page: number,
  pageSize: number,
) {
  return [
    "indexer",
    "campaign-donations",
    campaignId,
    { page, pageSize },
  ] as const;
}

export function fetchCampaignDonationsPage(
  campaignId: string,
  page: number,
  pageSize: number,
): Promise<PaginatedResponse<DonationResponse>> {
  return getCampaignDonations({ id: campaignId, page, pageSize });
}

/** Page-based campaign donations query (preferred for numbered pagination). */
export function useCampaignDonationsPage(
  campaignId: string | null,
  options: UseCampaignDonationsPageOptions,
) {
  const { page, enabled = true, refetchIntervalMs } = options;
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;

  return useQuery<PaginatedResponse<DonationResponse>, Error>({
    queryKey: campaignId
      ? campaignDonationsPageQueryKey(campaignId, page, pageSize)
      : ["indexer", "campaign-donations", null, { page, pageSize }],
    queryFn: () =>
      campaignId
        ? fetchCampaignDonationsPage(campaignId, page, pageSize)
        : Promise.resolve({
            data: [],
            page,
            pageSize,
            hasMore: false,
            totalCount: 0,
          }),
    enabled: Boolean(enabled && campaignId),
    refetchInterval: refetchIntervalMs,
    placeholderData: (previousData, previousQuery) => {
      if (!previousData || !previousQuery || !campaignId) {
        return undefined;
      }

      const prevKey = previousQuery.queryKey as readonly unknown[] | undefined;
      const prevCampaignId = prevKey?.[2];
      const prevParams = prevKey?.[3] as { pageSize?: number } | undefined;
      const prevPageSize = prevParams?.pageSize ?? DEFAULT_PAGE_SIZE;

      if (prevCampaignId !== campaignId || prevPageSize !== pageSize) {
        return undefined;
      }

      return previousData;
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
