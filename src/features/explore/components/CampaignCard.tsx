/**
 * Campaign Card Component
 *
 * Displays a campaign card with status, progress, and action buttons
 * Matches Figma design exactly
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import type { CampaignData } from "@/features/campaigns/hooks/useAllCampaigns";
import { useWalrusImage } from "@/features/campaigns/hooks/useWalrusImage";
import {
  CampaignStatusBadge,
  CampaignTimelineBadge,
  CategoriesBadgeGroup,
  ContributorsBadge,
} from "@/features/campaigns/components/CampaignBadges";
import { getCampaignStatusInfo } from "@/features/campaigns/utils/campaignStatus";
import { useNetworkVariable } from "@/shared/config/networkConfig";
import { buildCampaignDetailPath } from "@/shared/utils/routes";
import { resolveProfileLink } from "@/shared/utils/profile";
import { formatUsdLocaleFromMicros } from "@/shared/utils/currency";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";

interface CampaignCardProps {
  campaign: CampaignData;
  raisedUsdMicro?: bigint;
  supportersCount?: number;
}

const CAMPAIGN_PLACEHOLDER_IMAGE = "/assets/images/placeholders/campaign.png";

/**
 * Format address for display (0x36...c088)
 * Returns fallback message if address is missing or invalid
 */
function formatAddress(address: string | null | undefined): string {
  if (!address || address.length < 10) return "Not available";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

interface CampaignCoverImageProps {
  imageUrl: string | null;
  isLoading: boolean;
  alt: string;
}

function CampaignCoverImage({
  imageUrl,
  isLoading,
  alt,
}: CampaignCoverImageProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isImageErrored, setIsImageErrored] = useState(false);

  useEffect(() => {
    setIsImageLoaded(false);
    setIsImageErrored(false);
  }, [imageUrl]);

  if (isLoading) {
    return (
      <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-white-600" />
    );
  }

  if (imageUrl && !isImageErrored) {
    return (
      <div className="absolute inset-0 h-full w-full overflow-hidden bg-white-600">
        {!isImageLoaded ? (
          <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-white-600" />
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
      src={CAMPAIGN_PLACEHOLDER_IMAGE}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover"
      loading="lazy"
    />
  );
}

export function CampaignCard({
  campaign,
  raisedUsdMicro = 0n,
  supportersCount = 0,
}: CampaignCardProps) {
  const campaignDomain = useNetworkVariable("campaignDomain") as
    | string
    | undefined;
  const { data: coverImageObjectUrl, isError: isCoverImageError } =
    useWalrusImage(campaign.coverImageUrl);

  const statusInfo = getCampaignStatusInfo(
    campaign.startDateMs,
    campaign.endDateMs,
    campaign.isActive,
    campaign.isDeleted,
  );

  const fundingPercentage =
    campaign.fundingGoalUsdMicro > 0n
      ? Number((raisedUsdMicro * 100n) / campaign.fundingGoalUsdMicro)
      : 0;
  const formattedRaised = formatUsdLocaleFromMicros(raisedUsdMicro);
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
  const detailPath = useMemo(() => {
    const basePath = buildCampaignDetailPath(campaign.id, {
      subdomainName: campaign.subdomainName,
      campaignDomain,
    });
    // If the button is "View Updates", add the tab=updates query parameter
    if (statusInfo.buttonText === "View Updates") {
      return `${basePath}?tab=updates`;
    }
    return basePath;
  }, [
    campaign.id,
    campaign.subdomainName,
    campaignDomain,
    statusInfo.buttonText,
  ]);

  const publisherAddress = campaign.creatorAddress?.trim();
  const hasPublisherAddress =
    typeof publisherAddress === "string" &&
    publisherAddress.length >= 10 &&
    publisherAddress.startsWith("0x");
  const { handle: publisherHandle, profilePath: publisherProfilePath } =
    resolveProfileLink({
      address: hasPublisherAddress ? publisherAddress : null,
      subdomainName: campaign.ownerProfileSubdomainName ?? null,
      campaignDomain: campaignDomain ?? null,
    });
  const formattedPublisher = formatAddress(publisherAddress);
  const publisherLabel = publisherHandle ?? formattedPublisher;

  return (
    <div className="flex flex-col overflow-hidden rounded-[24px] relative">
      {/* Cover Image */}
      <div className="relative h-[280px] w-full">
        <CampaignCoverImage
          imageUrl={resolvedCoverImageUrl}
          isLoading={isCoverImageSourceLoading}
          alt={campaign.name}
        />

        {/* Status Badge - Top Left */}
        <div className="absolute left-4 top-5">
          <CampaignStatusBadge
            status={statusInfo.status}
            label={statusInfo.label}
          />
        </div>

        {/* Date Badge - Top Right */}
        <div className="absolute right-4 top-5">
          <CampaignTimelineBadge
            label={statusInfo.dateLabel}
            value={statusInfo.dateValue}
            iconName={statusInfo.timelineIcon}
          />
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-col flex-1 justify-between bg-white-500 px-4 pt-4 pb-6">
        {/* Content Section (Title, Data) */}
        <div className="flex flex-col gap-4">
          {/* Title and Description */}
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-xl leading-snug line-clamp-2">
              {campaign.name}
            </h3>
            <p className="text-base leading-relaxed line-clamp-3">
              {campaign.shortDescription}
            </p>
          </div>

          {/* Separator */}
          <div className="h-px bg-white-600" />

          {/* Publisher and Badges */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-xs text-black-200 leading-relaxed">
                Published by
              </span>
              {publisherProfilePath ? (
                <Link
                  to={publisherProfilePath}
                  className="text-sm font-medium leading-relaxed text-black-500 underline-offset-4 hover:text-black-500 hover:underline"
                >
                  {publisherLabel}
                </Link>
              ) : (
                <span className="text-sm font-medium leading-relaxed">
                  {publisherLabel}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <CategoriesBadgeGroup categories={campaign.category} />
              {supportersCount > 0 && (
                <ContributorsBadge contributorsCount={supportersCount} />
              )}
            </div>
          </div>

          {/* Progress Bar (only for funding status) */}
          {statusInfo.showProgress && (
            <div className="flex flex-col gap-2">
              {/* Progress Bar */}
              <div className="w-full h-2 bg-black-50 rounded-[10px] overflow-hidden">
                <div
                  className="h-full bg-sgreen-700 rounded-[10px] transition-all"
                  style={{ width: `${fundingPercentage}%` }}
                />
              </div>

              {/* Funding Stats */}
              <div className="flex items-center justify-between text-base leading-relaxed">
                <div className="flex items-center gap-1">
                  <span className="font-semibold">
                    {`$${formattedRaised} raised`}
                  </span>
                  <span>
                    of $
                    {formatUsdLocaleFromMicros(campaign.fundingGoalUsdMicro)}
                  </span>
                </div>
                <span>{fundingPercentage}% funded</span>
              </div>
            </div>
          )}

          {/* No progress - just show raised amount */}
          {!statusInfo.showProgress && raisedUsdMicro > 0n && (
            <div className="flex items-center justify-between text-base leading-relaxed">
              <div className="flex items-center gap-1">
                <span className="font-semibold">
                  {`$${formattedRaised} raised`}
                </span>
                <span>
                  of ${formatUsdLocaleFromMicros(campaign.fundingGoalUsdMicro)}
                </span>
              </div>
              <span>{fundingPercentage}% funded</span>
            </div>
          )}
        </div>

        {/* Action Button Section - Always at Bottom */}
        <Link to={detailPath} className="w-full pt-4">
          <Button
            className={`w-full min-h-10 ${
              statusInfo.buttonVariant === "primary"
                ? "bg-blue-500 text-white-50 shadow-none hover:bg-blue-600 border-0"
                : "bg-white-50 border border-black-50 shadow-none hover:bg-white-100 text-black-500"
            }`}
          >
            {statusInfo.buttonText}
          </Button>
        </Link>
      </div>
    </div>
  );
}
