import { Link } from "react-router-dom";

import { useWalrusImage } from "@/features/campaigns/hooks/useWalrusImage";
import type { CampaignData } from "@/features/campaigns/hooks/useAllCampaigns";
import { useNetworkVariable } from "@/shared/config/networkConfig";
import { formatUsdLocaleFromMicros } from "@/shared/utils/currency";
import { buildCampaignDetailPath } from "@/shared/utils/routes";

const PLACEHOLDER_IMAGE = "/assets/images/placeholders/campaign.png";

function formatUsd(value: bigint) {
  return formatUsdLocaleFromMicros(value);
}

interface HomeDiscoverCampaignCardSmallProps {
  campaign: CampaignData;
}

export function HomeDiscoverCampaignCardSmall({
  campaign,
}: HomeDiscoverCampaignCardSmallProps) {
  const campaignDomain = useNetworkVariable("campaignDomain") as
    | string
    | undefined;
  const { data: coverImageObjectUrl } = useWalrusImage(campaign.coverImageUrl);

  const hasCoverImage =
    typeof coverImageObjectUrl === "string" &&
    coverImageObjectUrl.trim().length > 0;
  const displayCoverImageUrl = hasCoverImage
    ? coverImageObjectUrl
    : PLACEHOLDER_IMAGE;

  const raisedUsdMicro = campaign.recipientTotalUsdMicro ?? 0n;
  const goalUsdMicro = campaign.fundingGoalUsdMicro ?? 0n;
  const progress =
    goalUsdMicro > 0n
      ? Math.min(100, Number((raisedUsdMicro * 100n) / goalUsdMicro))
      : 0;

  const detailPath = buildCampaignDetailPath(campaign.id, {
    subdomainName: campaign.subdomainName,
    campaignDomain,
  });

  return (
    <Link
      to={detailPath}
      className="flex h-full flex-col gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative w-full flex-1 overflow-hidden rounded-[24px] bg-white-600">
        <img
          src={displayCoverImageUrl}
          alt={campaign.name}
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = PLACEHOLDER_IMAGE;
          }}
        />
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-lg font-semibold leading-[1.5] text-black-500 line-clamp-2">
          {campaign.name}
        </p>

        <div className="flex flex-col gap-3">
          <div className="h-[8px] w-full overflow-hidden rounded-[99px] bg-purple-200">
            <div
              className="h-full rounded-[99px] bg-purple-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs leading-[1.5] text-black-500">
            <p className="font-semibold">${formatUsd(raisedUsdMicro)} raised</p>
            <p className="font-medium">${formatUsd(goalUsdMicro)}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
