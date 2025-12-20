import { PROFILE_METADATA_REMOVED_VALUE } from "@/features/profiles/constants/metadata";
import type { CampaignSocialLink } from "../types/campaign";

const SOCIALS_JSON_KEY = "socials_json";
const DEFAULT_SOCIAL_LINKS: CampaignSocialLink[] = [
  { platform: "website", url: "" },
  { platform: "twitter", url: "" },
  { platform: "instagram", url: "" },
];

export function getDefaultSocialLinks(): CampaignSocialLink[] {
  return DEFAULT_SOCIAL_LINKS.map((link) => ({ ...link }));
}

/**
 * Normalize and filter social links for storage.
 */
export function sanitizeSocialLinks(
  links: CampaignSocialLink[],
): CampaignSocialLink[] {
  return links
    .map((link) => {
      const platform = (link.platform ?? "").trim().toLowerCase();
      const url = (link.url ?? "").trim();
      return platform && url ? { platform, url } : null;
    })
    .filter((link): link is CampaignSocialLink => link !== null);
}

/**
 * Serialize social links into a JSON string for metadata storage.
 */
export function serializeSocialLinks(
  links: CampaignSocialLink[],
): string {
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
