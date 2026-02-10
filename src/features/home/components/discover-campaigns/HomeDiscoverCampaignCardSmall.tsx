import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useWalrusImage } from "@/features/campaigns/hooks/useWalrusImage";
import type { CampaignData } from "@/features/campaigns/hooks/useAllCampaigns";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useNetworkVariable } from "@/shared/config/networkConfig";
import { cn } from "@/shared/lib/utils";
import { formatUsdLocaleFromMicros } from "@/shared/utils/currency";
import { buildCampaignDetailPath } from "@/shared/utils/routes";

const PLACEHOLDER_IMAGE = "/assets/images/placeholders/campaign.png";

function formatUsd(value: bigint) {
  return formatUsdLocaleFromMicros(value);
}

interface HomeDiscoverCampaignCardSmallProps {
  campaign: CampaignData;
}

interface DiscoverCampaignCoverImageProps {
  imageUrl: string | null;
  isLoading: boolean;
  alt: string;
}

function DiscoverCampaignCoverImage({
  imageUrl,
  isLoading,
  alt,
}: DiscoverCampaignCoverImageProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isImageErrored, setIsImageErrored] = useState(false);

  useEffect(() => {
    setIsImageLoaded(false);
    setIsImageErrored(false);
  }, [imageUrl]);

  if (isLoading) {
    return (
      <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-black-100" />
    );
  }

  if (imageUrl && !isImageErrored) {
    return (
      <div className="absolute inset-0 h-full w-full overflow-hidden bg-white-600">
        {!isImageLoaded ? (
          <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-black-100" />
        ) : null}
        <img
          src={imageUrl}
          alt={alt}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-200",
            isImageLoaded ? "opacity-100" : "opacity-0",
          )}
          loading="lazy"
          onLoad={() => setIsImageLoaded(true)}
          onError={() => setIsImageErrored(true)}
        />
      </div>
    );
  }

  return (
    <img
      src={PLACEHOLDER_IMAGE}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover"
      loading="lazy"
    />
  );
}

export function HomeDiscoverCampaignCardSmall({
  campaign,
}: HomeDiscoverCampaignCardSmallProps) {
  const campaignDomain = useNetworkVariable("campaignDomain") as
    | string
    | undefined;
  const { data: coverImageObjectUrl, isError: isCoverImageError } =
    useWalrusImage(campaign.coverImageUrl);

  const hasCoverImageSource = Boolean(
    typeof campaign.coverImageUrl === "string" &&
      campaign.coverImageUrl.trim().length > 0,
  );
  const showCoverImage = Boolean(
    hasCoverImageSource && coverImageObjectUrl && !isCoverImageError,
  );
  const resolvedCoverImageUrl = showCoverImage
    ? coverImageObjectUrl ?? null
    : null;
  const isCoverImageSourceLoading = Boolean(
    hasCoverImageSource && !coverImageObjectUrl && !isCoverImageError,
  );

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
        <DiscoverCampaignCoverImage
          imageUrl={resolvedCoverImageUrl}
          isLoading={isCoverImageSourceLoading}
          alt={campaign.name}
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
