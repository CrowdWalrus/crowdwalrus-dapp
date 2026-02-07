import { useMemo, useCallback } from "react";

import { useCampaigns, type CampaignsPage } from "@/hooks/indexer/useCampaigns";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";
import { fetchWalrusText } from "@/services/walrus";
import type {
  CampaignDetail,
  CampaignSummary,
  CampaignVerificationStatus,
} from "@/services/indexer-services";
import { mapIndexerCampaignToData } from "@/features/campaigns/utils/mapIndexerCampaign";
import type { CampaignData } from "@/features/campaigns/types/campaignData";

export type { CampaignData } from "@/features/campaigns/types/campaignData";

interface UseAllCampaignsOptions {
  enabled?: boolean;
  pageSize?: number;
  verified?: boolean;
  verificationStatus?: CampaignVerificationStatus;
  ownerAddress?: string | null;
  hydrateDetails?: boolean;
}

/** Fetch and map paginated campaigns from the indexer into UI-ready data. */
export function useAllCampaigns(
  network: SupportedNetwork = DEFAULT_NETWORK,
  options: UseAllCampaignsOptions = {},
) {
  const {
    enabled = true,
    pageSize = 20,
    verified = false,
    verificationStatus,
    ownerAddress = null,
    hydrateDetails = false,
  } = options;
  const resolvedStatus = verificationStatus ?? (verified ? "verified" : "all");

  const query = useCampaigns({
    pageSize,
    verificationStatus: resolvedStatus,
    hydrateDetails,
    enabled,
    ownerAddress,
  });

  const campaignPages = useMemo(() => {
    if (!query.data?.pages) {
      return [];
    }

    return query.data.pages.map((page: CampaignsPage) => {
      const detailMap = new Map<string, CampaignDetail>();
      page.details.forEach((detail: CampaignDetail) => {
        detailMap.set(detail.campaignId, detail);
      });

      const data = page.summaries.map((summary: CampaignSummary) => {
        const detail = detailMap.get(summary.campaignId) ?? null;
        return mapIndexerCampaignToData(detail, summary, { network });
      });

      return {
        page: page.page,
        pageSize: page.pageSize,
        hasMore: page.hasMore,
        totalCount: page.totalCount,
        data,
      };
    });
  }, [network, query.data?.pages]);

  const campaigns = useMemo<CampaignData[]>(() => {
    const mapped = campaignPages.flatMap((page) => page.data);
    return mapped.sort((a, b) => b.createdAtMs - a.createdAtMs);
  }, [campaignPages]);

  const refetch = useCallback(() => {
    void query.refetch();
  }, [query]);

  return {
    campaigns,
    campaignPages,
    totalCount: query.data?.pages?.[0]?.totalCount ?? 0,
    isPending: query.isPending,
    error: (query.error as Error) ?? null,
    refetch,
    hasNoCampaigns: enabled && !query.isPending && campaigns.length === 0,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}

export function useCampaignDescription(descriptionUrl: string) {
  const fetchDescription = useCallback(async () => {
    if (!descriptionUrl) return "";

    try {
      return await fetchWalrusText(descriptionUrl);
    } catch (error) {
      console.error("Error fetching campaign description:", error);
      return "";
    }
  }, [descriptionUrl]);

  return fetchDescription;
}
