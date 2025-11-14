import { useEffect } from "react";

import type { CampaignData } from "@/features/campaigns/hooks/useAllCampaigns";
import { useCampaignStats } from "@/features/campaigns/hooks/useCampaignStats";
import { CampaignCard } from "@/features/explore/components/CampaignCard";

interface CampaignCardWithStatsProps {
  campaign: CampaignData;
}

export function CampaignCardWithStats({
  campaign,
}: CampaignCardWithStatsProps) {
  const {
    totalUsdMicro,
    totalDonationsCount,
    isPending,
    error,
  } = useCampaignStats({
    campaignId: campaign.id,
    statsId: campaign.statsId,
    enabled: Boolean(campaign.statsId || campaign.id),
  });

  useEffect(() => {
    if (error) {
      console.warn(
        `[CampaignCardWithStats] Failed to load stats for ${campaign.id}:`,
        error,
      );
    }
  }, [campaign.id, error]);

  const showFallback = error || isPending;

  return (
    <CampaignCard
      campaign={campaign}
      raisedUsdMicro={showFallback ? 0n : totalUsdMicro}
      supportersCount={showFallback ? 0 : totalDonationsCount}
    />
  );
}
