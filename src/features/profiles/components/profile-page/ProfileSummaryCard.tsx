import type { ReactNode } from "react";

import { Globe, Mail } from "lucide-react";

import { SOCIAL_PLATFORM_CONFIG } from "@/features/campaigns/constants/socialPlatforms";
import type { CampaignSocialLink } from "@/features/campaigns/types/campaign";
import { useWalrusImage } from "@/features/campaigns/hooks/useWalrusImage";

import { Card, CardContent } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { cn } from "@/shared/lib/utils";

interface ProfileSummaryMetadata {
  fullName?: string;
  subdomain?: string;
  email?: string;
  bio?: string;
  socialLinks?: CampaignSocialLink[];
  avatarWalrusUrl?: string | null;
}

interface ProfileSummaryCardProps {
  addressLabel: string;
  description: string;
  action?: ReactNode;
  avatarLabel?: string;
  metadata?: ProfileSummaryMetadata | null;
  className?: string;
}

export function ProfileSummaryCard({
  addressLabel,
  description,
  action,
  avatarLabel = "0x.",
  metadata,
  className,
}: ProfileSummaryCardProps) {
  const {
    data: avatarImageUrl,
    isPending: isAvatarLoading,
    isError: isAvatarError,
  } = useWalrusImage(metadata?.avatarWalrusUrl ?? null);

  const socialLinks = metadata?.socialLinks ?? [];
  const shouldRenderMetadata = Boolean(metadata);
  const displayName = metadata?.fullName?.trim() || addressLabel;
  const displaySubdomain = metadata?.subdomain?.trim() ?? "";
  const displayEmail = metadata?.email?.trim() ?? "";
  const displayBio = metadata?.bio?.trim() ?? "";
  const showSocialLinks = shouldRenderMetadata && socialLinks.length > 0;
  const showAvatarImage = Boolean(
    metadata?.avatarWalrusUrl && avatarImageUrl && !isAvatarError,
  );
  const resolvedAvatarImageUrl = showAvatarImage
    ? avatarImageUrl ?? null
    : null;

  if (shouldRenderMetadata) {
    return (
      <Card className={cn("border-black-50 bg-white", className)}>
        <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
          <div className="flex w-full flex-col gap-6 sm:flex-row sm:items-start">
            <ProfileAvatar
              imageUrl={resolvedAvatarImageUrl}
              isLoading={Boolean(isAvatarLoading && metadata?.avatarWalrusUrl)}
              fallbackLabel={avatarLabel}
              alt={displayName}
            />

            <div className="flex flex-1 flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-3xl font-semibold tracking-tight text-black-500">
                  {displayName}
                </span>
                {displaySubdomain ? (
                  <span className="text-sm font-medium text-black-300">
                    {displaySubdomain}
                  </span>
                ) : null}
              </div>

              {displayEmail ? (
                <a
                  href={`mailto:${displayEmail}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-black-400 hover:text-black-500"
                >
                  <Mail className="h-4 w-4 text-black-300" />
                  <span>{displayEmail}</span>
                </a>
              ) : null}

              {displayBio ? (
                <p className="text-base leading-relaxed text-black-400">
                  {displayBio}
                </p>
              ) : null}

              {showSocialLinks ? (
                <>
                  <Separator className="bg-white-600" />
                  <ProfileSocialLinks links={socialLinks} />
                </>
              ) : null}

              {action ? (
                <div className="flex flex-col gap-4">
                  <Separator className="bg-white-600" />
                  <div className="flex flex-wrap items-center gap-3">
                    {action}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-black-50 bg-white", className)}>
      <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
        <div className="flex w-full flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-black-50 text-4xl font-semibold text-black-500">
            {avatarLabel}
          </div>
          <div className="flex flex-1 flex-col gap-4 text-center sm:text-left">
            <div className="flex flex-col gap-2">
              <span className="text-3xl font-semibold tracking-tight text-black-500">
                {addressLabel}
              </span>
              {description ? (
                <p className="text-base leading-relaxed text-black-400">
                  {description}
                </p>
              ) : null}
            </div>
            {action ? (
              <div className="flex flex-col gap-4">
                <Separator className="bg-white-600" />
                <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                  {action}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ProfileAvatarProps {
  imageUrl: string | null;
  isLoading: boolean;
  fallbackLabel: string;
  alt: string;
}

function ProfileAvatar({
  imageUrl,
  isLoading,
  fallbackLabel,
  alt,
}: ProfileAvatarProps) {
  if (isLoading) {
    return (
      <div className="h-28 w-28 shrink-0 animate-pulse rounded-3xl bg-black-50" />
    );
  }

  if (imageUrl) {
    return (
      <div className="h-28 w-28 shrink-0 overflow-hidden rounded-3xl bg-black-50">
        <img
          src={imageUrl}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-black-50 text-4xl font-semibold text-black-500">
      {fallbackLabel}
    </div>
  );
}

function ProfileSocialLinks({ links }: { links: CampaignSocialLink[] }) {
  if (!links.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-4 text-black-200">
      {links.map((link, index) => {
        const platformKey = link.platform as keyof typeof SOCIAL_PLATFORM_CONFIG;
        const config = SOCIAL_PLATFORM_CONFIG[platformKey];
        const IconComponent = config?.icon ?? Globe;
        const label = config?.label ?? link.platform;

        return (
          <a
            key={`${link.platform}-${index}`}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            className="transition-colors hover:text-black-400"
          >
            <IconComponent size={20} />
          </a>
        );
      })}
    </div>
  );
}
