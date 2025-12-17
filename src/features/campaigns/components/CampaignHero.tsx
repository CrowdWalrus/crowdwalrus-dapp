/**
 * Campaign Hero Component
 * Main campaign visual and metadata section
 */

import { Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { SOCIAL_PLATFORM_CONFIG } from "@/features/campaigns/constants/socialPlatforms";
import type { CampaignSocialLink } from "@/features/campaigns/types/campaign";
import { Separator } from "@/shared/components/ui/separator";
import {
  CampaignStatusBadge,
  CategoryBadge,
  ContributorsBadge,
  EndsInBadge,
  StartsInBadge,
} from "./CampaignBadges";
import { getCampaignStatusInfo } from "../utils/campaignStatus";
import { useProfileHandle } from "@/features/profiles/hooks/useProfileHandle";

const PLACEHOLDER_IMAGE = "/assets/images/placeholders/campaign.png";

/**
 * Format address for display (0x36...c088)
 * Returns fallback message if address is missing or invalid
 */
function formatAddress(address: string | null | undefined): string {
  if (!address || address.length < 10) return "Not available";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

interface CampaignHeroProps {
  coverImageUrl: string;
  campaignName: string;
  shortDescription: string;
  isActive: boolean;
  isDeleted?: boolean;
  startDateMs: number;
  endDateMs: number;
  category: string;
  contributorsCount: number;
  publisherAddress: string;
  socialLinks: CampaignSocialLink[];
}

export function CampaignHero({
  coverImageUrl,
  campaignName,
  shortDescription,
  isActive,
  isDeleted = false,
  startDateMs,
  endDateMs,
  category,
  contributorsCount,
  publisherAddress,
  socialLinks,
}: CampaignHeroProps) {
  // Calculate days until start
  const nowMs = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntilStart = Math.ceil((startDateMs - nowMs) / msPerDay);
  const isUpcoming = daysUntilStart > 0;

  const daysUntilEnd = Number.isFinite(endDateMs)
    ? Math.ceil((endDateMs - nowMs) / msPerDay)
    : null;
  const normalizedEndDays =
    typeof daysUntilEnd === "number" ? Math.max(daysUntilEnd, 0) : null;

  // Derive unique, trimmed category identifiers from comma-separated string
  const categories = Array.from(
    new Set(
      category
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
  const categoryValues =
    categories.length > 0
      ? categories
      : category.trim()
        ? [category.trim()]
        : [];
  const hasCoverImage =
    !!(coverImageUrl && coverImageUrl.trim().length > 0);
  const displayCoverImageUrl = hasCoverImage
    ? coverImageUrl
    : PLACEHOLDER_IMAGE;

  const statusInfo = getCampaignStatusInfo(
    startDateMs,
    endDateMs,
    isActive,
    isDeleted,
  );

  const normalizedPublisherAddress = publisherAddress?.trim();
  const hasPublisherAddress =
    typeof normalizedPublisherAddress === "string" &&
    normalizedPublisherAddress.length >= 10 &&
    normalizedPublisherAddress.startsWith("0x");
  const { handle: publisherHandle, profilePath: publisherProfilePath } =
    useProfileHandle(hasPublisherAddress ? normalizedPublisherAddress : null);
  const formattedPublisher = formatAddress(normalizedPublisherAddress);
  const publisherLabel = publisherHandle ?? formattedPublisher;

  return (
    <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6 w-full">
      {/* Cover Image */}
      <div className="w-full h-[240px] sm:h-[320px] md:h-[380px] lg:h-[432px] rounded-2xl sm:rounded-3xl overflow-hidden bg-muted">
        <img
          src={displayCoverImageUrl}
          alt={campaignName}
          className="w-full h-full object-cover"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = PLACEHOLDER_IMAGE;
          }}
        />
      </div>

      {/* Campaign Info Section */}
      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* Short Description */}
        <p className="text-sm sm:text-base text-black-400">{shortDescription}</p>

        {/* Badges Row */}
        <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4 w-full flex-wrap">
          {/* Left badges */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-wrap">
            <CampaignStatusBadge
              status={statusInfo.status}
              label={statusInfo.label}
            />
            {isUpcoming &&
              Number.isFinite(daysUntilStart) &&
              daysUntilStart > 0 && (
                <StartsInBadge daysUntilStart={daysUntilStart} />
              )}
            {!isUpcoming &&
              isActive &&
              normalizedEndDays !== null &&
              normalizedEndDays > 0 && (
                <EndsInBadge daysUntilEnd={normalizedEndDays} />
              )}
            {categoryValues.map((cat) => (
              <CategoryBadge key={cat} category={cat} />
            ))}
          </div>

          {/* Right badges */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-wrap">
            <ContributorsBadge contributorsCount={contributorsCount} />
          </div>
        </div>

        {/* Separator */}
        <Separator className="bg-white-600" />

        {/* Publisher and Social Links */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 w-full">
          {/* Published by */}
          <div className="flex flex-col">
            <p className="text-xs sm:text-sm text-black-200">Published by</p>
            {publisherProfilePath ? (
              <Link
                to={publisherProfilePath}
                className="text-sm sm:text-base text-black-500 underline-offset-4 hover:text-black-500 hover:underline"
              >
                {publisherLabel}
              </Link>
            ) : (
              <p className="text-sm sm:text-base">{publisherLabel}</p>
            )}
          </div>

          {/* Social Icons */}
          <div className="flex text-black-200 items-center gap-3 sm:gap-4">
            {socialLinks.map((link, index) => {
              const config =
                SOCIAL_PLATFORM_CONFIG[
                  link.platform as keyof typeof SOCIAL_PLATFORM_CONFIG
                ];
              const IconComponent = config?.icon ?? Globe;
              const label =
                config?.label ??
                `${link.platform.charAt(0).toUpperCase()}${link.platform.slice(1)}`;

              return (
                <a
                  key={`${link.platform}-${index}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  aria-label={label}
                >
                  <IconComponent className="size-4 sm:size-5 shrink-0" />
                </a>
              );
            })}
          </div>
        </div>

        {/* Bottom Separator */}
        <Separator className="bg-white-600" />
      </div>
    </div>
  );
}
