import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  getCampaignById,
  getDiscoverCampaigns,
  type CampaignDetail,
  type CampaignSummary,
  type DiscoverFundingMetric,
} from "@/services/indexer-services";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";
import { mapIndexerCampaignToData } from "@/features/campaigns/utils/mapIndexerCampaign";
import type { CampaignData } from "@/features/campaigns/types/campaignData";

interface UseDiscoverCampaignsOptions {
  enabled?: boolean;
  pageSize?: number;
  fundingMetric?: DiscoverFundingMetric;
  hydrateDetails?: boolean;
}

interface DiscoverCampaignsPayload {
  summaries: CampaignSummary[];
  details: CampaignDetail[];
}

/** Fetch and map discover campaigns with optional detail hydration. */
export function useDiscoverCampaigns(
  network: SupportedNetwork = DEFAULT_NETWORK,
  options: UseDiscoverCampaignsOptions = {},
) {
  const {
    enabled = true,
    pageSize = 5,
    fundingMetric = "recipient",
    hydrateDetails = false,
  } = options;

  // Discover ordering is phase-based (funding -> active -> open soon -> ended) with backend-only deleted filtering.
  const query = useQuery<DiscoverCampaignsPayload, Error>({
    queryKey: [
      "indexer",
      "campaigns",
      "discover",
      { pageSize, fundingMetric, hydrateDetails },
    ],
    queryFn: async () => {
      const response = await getDiscoverCampaigns({
        page: 1,
        pageSize,
        fundingMetric,
      });

      if (!hydrateDetails) {
        return {
          summaries: response.data,
          details: [],
        };
      }

      const details = await Promise.all(
        response.data.map(async (summary) => {
          try {
            return await getCampaignById(summary.campaignId);
          } catch (error) {
            console.warn(
              `[useDiscoverCampaigns] Failed to hydrate campaign ${summary.campaignId}`,
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
      };
    },
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const campaigns = useMemo<CampaignData[]>(() => {
    if (!query.data?.summaries) {
      return [];
    }

    const detailMap = new Map<string, CampaignDetail>();
    query.data.details.forEach((detail) => {
      detailMap.set(detail.campaignId, detail);
    });

    return query.data.summaries.map((summary) => {
      const detail = detailMap.get(summary.campaignId) ?? null;
      return mapIndexerCampaignToData(detail, summary, { network });
    });
  }, [network, query.data]);

  return {
    campaigns,
    isPending: query.isPending,
    error: (query.error as Error) ?? null,
    refetch: query.refetch,
  };
}
