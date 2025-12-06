/**
 * Hook to fetch a single campaign from the Indexer API and map it into UI-friendly shape.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getCampaignById } from "@/services/indexer-services";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";
import { mapIndexerCampaignToData } from "@/features/campaigns/utils/mapIndexerCampaign";
import type { CampaignData } from "@/features/campaigns/types/campaignData";

export function useCampaign(
  campaignId: string,
  network: SupportedNetwork = DEFAULT_NETWORK,
) {
  const query = useQuery({
    queryKey: ["indexer", "campaign", campaignId],
    queryFn: () => getCampaignById(campaignId),
    enabled: Boolean(campaignId),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const campaign = useMemo<CampaignData | null>(() => {
    if (!query.data) {
      return null;
    }
    return mapIndexerCampaignToData(query.data, null, { network });
  }, [network, query.data]);

  return {
    campaign,
    isPending: query.isPending,
    error: (query.error as Error) ?? null,
    refetch: query.refetch,
  };
}
