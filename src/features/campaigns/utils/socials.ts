import type { CampaignSocialLink } from "../types/campaign";

const SOCIALS_JSON_KEY = "socials_json";

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
 * Parse social links from metadata map. Supports both the new socials_json key and
 * legacy per-platform keys (social_twitter, etc).
 */
export function parseSocialLinksFromMetadata(
  metadataMap: Record<string, string>,
): CampaignSocialLink[] {
  const links: CampaignSocialLink[] = [];

  const socialsJson = metadataMap[SOCIALS_JSON_KEY];
  if (socialsJson) {
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

/**
 * Fetch the first social link for a given platform.
 */
export function getPrimarySocialUrl(
  links: CampaignSocialLink[],
  platform: string,
): string | undefined {
  const normalized = platform.trim().toLowerCase();
  return links.find((link) => link.platform === normalized)?.url;
}

/**
 * Group social links by platform for quick lookup.
 */
export function groupSocialLinksByPlatform(
  links: CampaignSocialLink[],
): Map<string, CampaignSocialLink[]> {
  const grouped = new Map<string, CampaignSocialLink[]>();
  sanitizeSocialLinks(links).forEach((link) => {
    const bucket = grouped.get(link.platform);
    if (bucket) {
      bucket.push(link);
    } else {
      grouped.set(link.platform, [link]);
    }
  });
  return grouped;
}
