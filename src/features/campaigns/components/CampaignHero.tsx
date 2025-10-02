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
      <div className="w-full h-[432px] rounded-[24px] overflow-hidden bg-muted">
        <img
          src={coverImageUrl}
          alt={campaignName}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Campaign Info Section */}
      <div className="flex flex-col gap-4 w-full">
        {/* Short Description */}
        <p className="font-['Inter'] text-base font-normal leading-[1.6] text-[#3d3f49]">
          {shortDescription}
        </p>

        {/* Badges Row */}
        <div className="flex items-center justify-between w-full">
          {/* Left badges */}
          <div className="flex items-center gap-4">
            {isUpcoming && (
              <Badge
                variant="outline"
                className="bg-[#fff7e9] border-[#fdb022] text-[#e6a01f]  text-xs font-medium leading-[1.5] tracking-[0.18px] px-2 py-0.5 h-6 rounded-lg gap-1.5"
              >
                <Clock className="size-3" />
                Open Soon
              </Badge>
            )}
            {isUpcoming && daysUntilStart > 0 && (
              <Badge
                variant="outline"
                className="bg-[#e7e7e8] border-transparent text-[#0c0f1c]  text-xs font-medium leading-[1.5] tracking-[0.18px] px-2 py-0.5 h-6 rounded-lg gap-1.5"
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
              className="bg-[#e7e7e8] border-transparent text-[#0c0f1c]  text-xs font-medium leading-[1.5] tracking-[0.18px] px-2 py-0.5 h-6 rounded-lg gap-1.5"
            >
              <Briefcase className="size-3" />
              {category}
            </Badge>
            <Badge
              variant="outline"
              className="bg-[#e7e7e8] border-transparent text-[#0c0f1c]  text-xs font-medium leading-[1.5] tracking-[0.18px] px-2 py-0.5 h-6 rounded-lg gap-1.5"
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
            <p className="font-['Inter'] text-sm font-normal leading-[1.6] text-[#8f9197]">
              Published by
            </p>
            <p className="font-['Inter'] text-base font-medium leading-[1.6] text-[#0c0f1c]">
              {publisherAddress.slice(0, 4)}...{publisherAddress.slice(-4)}
            </p>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            {socialLinkedin && (
              <a
                href={socialLinkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-muted-foreground transition-colors"
              >
                <Linkedin className="size-6" />
              </a>
            )}
            {socialInstagram && (
              <a
                href={socialInstagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-muted-foreground transition-colors"
              >
                <Instagram className="size-6" />
              </a>
            )}
            {socialWebsite && (
              <a
                href={socialWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-muted-foreground transition-colors"
              >
                <Globe className="size-6" />
              </a>
            )}
            {socialTwitter && (
              <a
                href={socialTwitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-muted-foreground transition-colors"
              >
                <XIcon className="size-6" />
              </a>
            )}
            <a
              href="#"
              className="text-foreground hover:text-muted-foreground transition-colors"
            >
              <Send className="size-6" />
            </a>
          </div>
        </div>

        {/* Bottom Separator */}
        <Separator className="bg-[#e1e1e1]" />
      </div>
    </div>
  );
}
