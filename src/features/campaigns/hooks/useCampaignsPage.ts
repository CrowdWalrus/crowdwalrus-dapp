import { useMemo } from "react";

import { useCampaignsPage as useIndexerCampaignsPage } from "@/hooks/indexer/useCampaignsPage";
import type { CampaignVerificationStatus } from "@/services/indexer-services";
import { mapIndexerCampaignToData } from "@/features/campaigns/utils/mapIndexerCampaign";
import type { CampaignData } from "@/features/campaigns/types/campaignData";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";

interface UseCampaignsPageOptions {
  page: number;
  pageSize?: number;
  verificationStatus?: CampaignVerificationStatus;
  verified?: boolean;
  ownerAddress?: string | null;
  enabled?: boolean;
}

const DEFAULT_PAGE_SIZE = 20;

/** Page-based campaign hook that maps summaries into CampaignData for UI use. */
export function useCampaignsPage(
  network: SupportedNetwork = DEFAULT_NETWORK,
  options: UseCampaignsPageOptions,
) {
  const query = useIndexerCampaignsPage(options);

  const campaigns = useMemo<CampaignData[]>(() => {
    const summaries = query.data?.data ?? [];
    return summaries.map((summary) =>
      mapIndexerCampaignToData(null, summary, { network }),
    );
  }, [network, query.data?.data]);

  return {
    campaigns,
    page: query.data?.page ?? options.page,
    pageSize: query.data?.pageSize ?? options.pageSize ?? DEFAULT_PAGE_SIZE,
    hasMore: query.data?.hasMore ?? false,
    totalCount: query.data?.totalCount ?? 0,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isPlaceholderData: query.isPlaceholderData ?? false,
    error: (query.error as Error) ?? null,
    refetch: query.refetch,
  };
}
