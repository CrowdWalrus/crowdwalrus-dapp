/**
 * Campaign Hero Component
 * Main campaign visual and metadata section
 */

import {
  Clock,
  Briefcase,
  Users,
  Linkedin,
  Instagram,
  Globe,
  Send,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { XIcon } from "lucide-react";
import LinkedInSocial from "@/shared/icons/socials/LinkedInSocial";
import InstagramSocial from "@/shared/icons/socials/InstagramSocial";
import XSocial from "@/shared/icons/socials/XSocial";
import TelegramSocial from "@/shared/icons/socials/TelegramSocial";

interface CampaignHeroProps {
  coverImageUrl: string;
  campaignName: string;
  shortDescription: string;
  isActive: boolean;
  validated: boolean;
  startDate: number;
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
  startDate,
  category,
  contributorsCount,
  publisherAddress,
  socialTwitter,
  socialWebsite,
  socialLinkedin,
  socialInstagram,
}: CampaignHeroProps) {
  // Calculate days until start
  const now = Date.now() / 1000;
  const daysUntilStart = Math.ceil((startDate - now) / (24 * 60 * 60));
  const isUpcoming = daysUntilStart > 0;

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
            {isUpcoming && (
              <Badge
                variant="outline"
                className="bg-orange-50 border-orange-500 text-orange-600  text-xs px-2 py-0.5 h-6 rounded-lg gap-1.5"
              >
                <Clock className="size-3" />
                Open Soon
              </Badge>
            )}
            {isUpcoming && daysUntilStart > 0 && (
              <Badge
                variant="outline"
                className="bg-black-50 text-xs px-2 py-0.5 h-6 rounded-lg gap-1.5"
              >
                <Clock className="size-3" />
                Starts in {daysUntilStart} days
              </Badge>
            )}
          </div>

          {/* Right badges */}
          <div className="flex items-center gap-4">
            <Badge
              variant="outline"
              className="bg-black-50 text-xs font-medium px-2 py-0.5 h-6 rounded-lg gap-1.5"
            >
              <Briefcase className="size-3" />
              {category}
            </Badge>
            <Badge
              variant="outline"
              className="bg-black-50 text-xs px-2 py-0.5 h-6 rounded-lg gap-1.5"
            >
              <Users className="size-3" />
              {contributorsCount}
            </Badge>
          </div>
        </div>

        {/* Separator */}
        <Separator className="bg-[#e1e1e1]" />

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
        <Separator className="bg-[#e1e1e1]" />
      </div>
    </div>
  );
}
