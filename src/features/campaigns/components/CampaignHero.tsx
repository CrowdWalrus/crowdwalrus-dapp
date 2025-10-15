/**
 * Campaign Hero Component
 * Main campaign visual and metadata section
 */

import { Globe } from "lucide-react";
import { SOCIAL_PLATFORM_CONFIG } from "@/features/campaigns/constants/socialPlatforms";
import type { CampaignSocialLink } from "@/features/campaigns/types/campaign";
import { Separator } from "@/shared/components/ui/separator";
import {
  CategoryBadge,
  ContributorsBadge,
  EndsInBadge,
  OpenSoonBadge,
  StartsInBadge,
} from "./CampaignBadges";

const PLACEHOLDER_IMAGE = "/assets/images/placeholders/campaign.png";

interface CampaignHeroProps {
  coverImageUrl: string;
  campaignName: string;
  shortDescription: string;
  isActive: boolean;
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

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Cover Image */}
      <div className="w-full h-[432px] rounded-3xl overflow-hidden bg-muted">
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
      <div className="flex flex-col gap-4 w-full">
        {/* Short Description */}
        <p className="text-black-400">{shortDescription}</p>

        {/* Badges Row */}
        <div className="flex items-center justify-between gap-4 w-full flex-wrap">
          {/* Left badges */}
          <div className="flex items-center gap-4 flex-wrap">
            {isUpcoming && <OpenSoonBadge />}
            {isUpcoming &&
              Number.isFinite(daysUntilStart) &&
              daysUntilStart > 0 && (
                <StartsInBadge daysUntilStart={daysUntilStart} />
              )}
            {!isUpcoming &&
              isActive &&
              normalizedEndDays !== null && (
                <EndsInBadge daysUntilEnd={normalizedEndDays} />
              )}
            {categoryValues.map((cat) => (
              <CategoryBadge key={cat} category={cat} />
            ))}
          </div>

          {/* Right badges */}
          <div className="flex items-center gap-4 flex-wrap">
            <ContributorsBadge contributorsCount={contributorsCount} />
          </div>
        </div>

        {/* Separator */}
        <Separator className="bg-white-600" />

        {/* Publisher and Social Links */}
        <div className="flex items-center justify-between w-full">
          {/* Published by */}
          <div className="flex flex-col">
            <p className="text-sm text-black-200">Published by</p>
            <p>
              {publisherAddress.slice(0, 4)}...{publisherAddress.slice(-4)}
            </p>
          </div>

          {/* Social Icons */}
          <div className="flex text-black-200 items-center gap-4">
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
                  <IconComponent className="size-5 shrink-0" />
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
