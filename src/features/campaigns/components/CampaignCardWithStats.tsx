import type { CampaignData } from "@/features/campaigns/hooks/useAllCampaigns";
import { CampaignCard } from "@/features/explore/components/CampaignCard";

interface CampaignCardWithStatsProps {
  campaign: CampaignData;
}

export function CampaignCardWithStats({
  campaign,
}: CampaignCardWithStatsProps) {
  return (
    <CampaignCard
      campaign={campaign}
      raisedUsdMicro={campaign.totalUsdMicro}
      supportersCount={campaign.uniqueDonorsCount}
    />
  );
}
