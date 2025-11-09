/**
 * Campaign Card Component
 *
 * Displays a campaign card with status, progress, and action buttons
 * Matches Figma design exactly
 */

import { useMemo } from "react";
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
import {
  formatUsdLocaleFromMicros,
  usdMicrosToNumber,
} from "@/shared/utils/currency";

interface CampaignCardProps {
  campaign: CampaignData;
  raised?: number; // Amount raised in SUI (mock data for now)
  supporters?: number; // Number of supporters (mock data for now)
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

/**
 * Calculate funding percentage
 */
function calculateFundingPercentage(raised: number, goal: number): number {
  if (goal === 0) return 0;
  return Math.min(Math.round((raised / goal) * 100), 100);
}

export function CampaignCard({
  campaign,
  raised = 0,
  supporters = 0,
}: CampaignCardProps) {
  const campaignDomain = useNetworkVariable("campaignDomain") as
    | string
    | undefined;
  const { data: coverImageObjectUrl, isPending: isCoverImagePending } =
    useWalrusImage(campaign.coverImageUrl);

  const statusInfo = getCampaignStatusInfo(
    campaign.startDateMs,
    campaign.endDateMs,
    campaign.isActive,
    campaign.isDeleted,
  );

  const fundingGoal = usdMicrosToNumber(campaign.fundingGoalUsdMicro);
  const fundingPercentage = calculateFundingPercentage(raised, fundingGoal);
  const hasCoverImage =
    typeof coverImageObjectUrl === "string" &&
    coverImageObjectUrl.trim().length > 0;
  const displayCoverImageUrl = hasCoverImage
    ? coverImageObjectUrl
    : CAMPAIGN_PLACEHOLDER_IMAGE;
  const detailPath = useMemo(
    () =>
      buildCampaignDetailPath(campaign.id, {
        subdomainName: campaign.subdomainName,
        campaignDomain,
      }),
    [campaign.id, campaign.subdomainName, campaignDomain],
  );

  return (
    <div className="flex flex-col overflow-hidden rounded-[24px] relative">
      {/* Cover Image */}
      <div className="relative h-[280px] w-full">
        {isCoverImagePending ? (
          <div className="absolute inset-0 w-full h-full bg-white-600 flex items-center justify-center">
            <span className="text-black-300 text-sm">Loading image...</span>
          </div>
        ) : (
          <img
            src={displayCoverImageUrl}
            alt={campaign.name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = CAMPAIGN_PLACEHOLDER_IMAGE;
            }}
          />
        )}

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
              <span className="text-sm font-medium leading-relaxed">
                {formatAddress(campaign.creatorAddress)}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <CategoriesBadgeGroup categories={campaign.category} />
              {supporters > 0 && (
                <ContributorsBadge contributorsCount={supporters} />
              )}
            </div>
          </div>

          {/* Progress Bar (only for funding status) */}
          {statusInfo.showProgress && (
            <div className="flex flex-col gap-2">
              {/* Progress Bar */}
              <div className="w-full h-2 bg-black-50 rounded-[10px] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sgreen-500 to-sgreen-400 rounded-[10px] transition-all"
                  style={{ width: `${fundingPercentage}%` }}
                />
              </div>

              {/* Funding Stats */}
              <div className="flex items-center justify-between text-base leading-relaxed">
                <div className="flex items-center gap-1">
                  <span className="font-semibold">
                    ${raised.toLocaleString()} raised
                  </span>
                  <span>
                    of {formatUsdLocaleFromMicros(campaign.fundingGoalUsdMicro)}
                  </span>
                </div>
                <span>{fundingPercentage}% funded</span>
              </div>
            </div>
          )}

          {/* No progress - just show raised amount */}
          {!statusInfo.showProgress && raised > 0 && (
            <div className="flex items-center justify-between text-base leading-relaxed">
              <div className="flex items-center gap-1">
                <span className="font-semibold">
                  ${raised.toLocaleString()} raised
                </span>
                <span>
                  of {formatUsdLocaleFromMicros(campaign.fundingGoalUsdMicro)}
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
