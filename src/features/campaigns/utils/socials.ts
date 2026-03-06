import { PROFILE_METADATA_REMOVED_VALUE } from "@/features/profiles/constants/metadata";
import { MIN_CAMPAIGN_SOCIAL_LINKS } from "../constants/socialPlatforms";
import type { CampaignSocialLink } from "../types/campaign";

type SocialLinkInput = Partial<CampaignSocialLink>;

const SOCIALS_JSON_KEY = "socials_json";
const DEFAULT_SOCIAL_LINKS: CampaignSocialLink[] = [
  { platform: "website", url: "" },
  { platform: "twitter", url: "" },
  { platform: "instagram", url: "" },
];

export function getDefaultSocialLinks(): CampaignSocialLink[] {
  return DEFAULT_SOCIAL_LINKS.map((link) => ({ ...link }));
}

export function isValidSocialLinkUrl(value: string): boolean {
  if (!value || /\s/.test(value)) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Normalize and filter social links for storage.
 */
export function sanitizeSocialLinks(
  links: SocialLinkInput[],
): CampaignSocialLink[] {
  return links
    .map((link) => {
      const platform = (link.platform ?? "").trim().toLowerCase();
      const url = (link.url ?? "").trim();
      return platform && isValidSocialLinkUrl(url) ? { platform, url } : null;
    })
    .filter((link): link is CampaignSocialLink => link !== null);
}

export const CAMPAIGN_SOCIAL_LINKS_MIN_ERROR = `Add at least ${MIN_CAMPAIGN_SOCIAL_LINKS} valid social links. Empty or invalid links do not count.`;

export function getCompletedSocialLinksCount(links: SocialLinkInput[]): number {
  return sanitizeSocialLinks(links).length;
}

export function sanitizeCampaignSocialLinks(
  links: SocialLinkInput[],
): CampaignSocialLink[] {
  const sanitizedLinks = sanitizeSocialLinks(links);

  if (sanitizedLinks.length < MIN_CAMPAIGN_SOCIAL_LINKS) {
    throw new Error(CAMPAIGN_SOCIAL_LINKS_MIN_ERROR);
  }

  return sanitizedLinks;
}

export function normalizeCampaignSocialsMetadataValue(value: string): string {
  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      throw new Error(CAMPAIGN_SOCIAL_LINKS_MIN_ERROR);
    }

    return JSON.stringify(
      sanitizeCampaignSocialLinks(parsed as CampaignSocialLink[]),
    );
  } catch {
    throw new Error(CAMPAIGN_SOCIAL_LINKS_MIN_ERROR);
  }
}

/**
 * Serialize social links into a JSON string for metadata storage.
 */
export function serializeSocialLinks(links: CampaignSocialLink[]): string {
  return JSON.stringify(sanitizeSocialLinks(links));
}

/**
 * Parse social links from metadata map.
 */
export function parseSocialLinksFromMetadata(
  metadataMap: Record<string, string>,
): CampaignSocialLink[] {
  const links: CampaignSocialLink[] = [];

  const socialsJson = metadataMap[SOCIALS_JSON_KEY];
  if (socialsJson && socialsJson !== PROFILE_METADATA_REMOVED_VALUE) {
    try {
      const parsed = JSON.parse(socialsJson);
      if (Array.isArray(parsed)) {
        parsed.forEach((entry) => {
          const platform = (entry?.platform ?? "").trim().toLowerCase();
          const url = (entry?.url ?? "").trim();
          if (platform && url) {
            links.push({ platform, url });
          }
        });
      }
    } catch (error) {
      console.warn("Failed to parse socials_json metadata:", error);
    }
  }

  return links;
}
