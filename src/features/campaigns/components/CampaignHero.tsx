/**
 * Campaign Hero Component
 * Main campaign visual and metadata section
 */

import { Globe } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import LinkedInSocial from "@/shared/icons/socials/LinkedInSocial";
import InstagramSocial from "@/shared/icons/socials/InstagramSocial";
import XSocial from "@/shared/icons/socials/XSocial";
import TelegramSocial from "@/shared/icons/socials/TelegramSocial";
import {
  CategoryBadge,
  ContributorsBadge,
  OpenSoonBadge,
  StartsBadge,
  StartsInBadge,
  VerificationBadge,
} from "./CampaignBadges";

interface CampaignHeroProps {
  coverImageUrl: string;
  campaignName: string;
  shortDescription: string;
  isActive: boolean;
  isVerified: boolean;
  startDateMs: number;
  category: string;
  contributorsCount: number;
  publisherAddress: string;
  socialTwitter?: string;
  socialDiscord?: string;
  socialWebsite?: string;
  socialLinkedin?: string;
  socialInstagram?: string;
}

export function CampaignHero({
  coverImageUrl,
  campaignName,
  shortDescription,
  isActive,
  isVerified,
  startDateMs,
  category,
  contributorsCount,
  publisherAddress,
  socialTwitter,
  socialWebsite,
  socialLinkedin,
  socialInstagram,
}: CampaignHeroProps) {
  // Calculate days until start
  const nowMs = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntilStart = Math.ceil((startDateMs - nowMs) / msPerDay);
  const isUpcoming = daysUntilStart > 0;

  const formattedStart = Number.isFinite(startDateMs)
    ? new Date(startDateMs).toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : "Unknown";

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Cover Image */}
      <div className="w-full h-[432px] rounded-3xl overflow-hidden bg-muted">
        <img
          src={coverImageUrl}
          alt={campaignName}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Campaign Info Section */}
      <div className="flex flex-col gap-4 w-full">
        {/* Short Description */}
        <p className="text-black-400">{shortDescription}</p>

        {/* Badges Row */}
        <div className="flex items-center justify-between w-full">
          {/* Left badges */}
          <div className="flex items-center gap-4">
            {isUpcoming && <OpenSoonBadge />}
            {isUpcoming && Number.isFinite(daysUntilStart) && daysUntilStart > 0 && (
              <StartsInBadge daysUntilStart={daysUntilStart} />
            )}
            <StartsBadge formattedDate={formattedStart} />
          </div>

          {/* Right badges */}
          <div className="flex items-center gap-4">
            <CategoryBadge category={category} />
            <ContributorsBadge contributorsCount={contributorsCount} />
            <VerificationBadge isVerified={isVerified} />
            <Badge
              variant="outline"
              className={`text-xs px-2 py-0.5 h-6 rounded-lg gap-1.5 ${
                isActive ? "bg-blue-100 text-blue-800" : "bg-gray-200 text-gray-700"
              }`}
            >
              {isActive ? "Active" : "Inactive"}
            </Badge>
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
            {socialLinkedin && (
              <a
                href={socialLinkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkedInSocial />
              </a>
            )}
            {socialInstagram && (
              <a
                href={socialInstagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                <InstagramSocial />
              </a>
            )}
            {socialWebsite && (
              <a href={socialWebsite} target="_blank" rel="noopener noreferrer">
                <Globe />
              </a>
            )}
            {socialTwitter && (
              <a
                href={socialTwitter}
                className="text-black-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <XSocial />
              </a>
            )}
            <a href="#">
              <TelegramSocial />
            </a>
          </div>
        </div>

        {/* Bottom Separator */}
        <Separator className="bg-white-600" />
      </div>
    </div>
  );
}
