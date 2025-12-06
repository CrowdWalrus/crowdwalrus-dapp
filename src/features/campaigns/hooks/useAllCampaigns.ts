import { useMemo, useCallback } from "react";

import { useCampaigns, type CampaignsPage } from "@/hooks/indexer/useCampaigns";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";
import type {
  CampaignDetail,
  CampaignSummary,
} from "@/services/indexer-services";
import { mapIndexerCampaignToData } from "@/features/campaigns/utils/mapIndexerCampaign";
import type { CampaignData } from "@/features/campaigns/types/campaignData";

export type { CampaignData } from "@/features/campaigns/types/campaignData";

interface UseAllCampaignsOptions {
  enabled?: boolean;
  pageSize?: number;
  verified?: boolean;
}

/** Fetch and map paginated campaigns from the indexer into UI-ready data. */
export function useAllCampaigns(
  network: SupportedNetwork = DEFAULT_NETWORK,
  options: UseAllCampaignsOptions = {},
) {
  const { enabled = true, pageSize = 20, verified = false } = options;

  const query = useCampaigns({
    pageSize,
    verified,
    hydrateDetails: true,
    enabled,
  });

  const campaigns = useMemo<CampaignData[]>(() => {
    if (!query.data?.pages) {
      return [];
    }

    const mapped: CampaignData[] = [];

    query.data.pages.forEach((page: CampaignsPage) => {
      const detailMap = new Map<string, CampaignDetail>();
      page.details.forEach((detail: CampaignDetail) => {
        detailMap.set(detail.campaignId, detail);
      });

      page.summaries.forEach((summary: CampaignSummary) => {
        const detail = detailMap.get(summary.campaignId) ?? null;
        mapped.push(
          mapIndexerCampaignToData(detail, summary, { network }),
        );
      });
    });

    return mapped.sort((a, b) => b.createdAtMs - a.createdAtMs);
  }, [network, query.data?.pages]);

  const refetch = useCallback(() => {
    void query.refetch();
  }, [query]);

  return {
    campaigns,
    isPending: query.isPending,
    error: (query.error as Error) ?? null,
    refetch,
    hasNoCampaigns: !query.isPending && campaigns.length === 0,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}

export function useCampaignDescription(descriptionUrl: string) {
  const fetchDescription = useCallback(async () => {
    if (!descriptionUrl) return "";

    try {
      const response = await fetch(descriptionUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch description: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      console.error("Error fetching campaign description:", error);
      return "";
    }
  }, [descriptionUrl]);

  return fetchDescription;
}
