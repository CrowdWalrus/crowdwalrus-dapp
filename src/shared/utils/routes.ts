import { toCampaignSlug } from "@/shared/utils/subdomain";

interface BuildCampaignDetailPathOptions {
  subdomainName?: string | null;
  campaignDomain?: string | null;
}

const CAMPAIGNS_PREFIX = "/campaigns";

const sanitizeSegment = (segment: string | null | undefined): string => {
  if (!segment) {
    return "";
  }
  return encodeURIComponent(segment.trim());
};

const resolveCampaignSegment = (
  campaignId: string,
  { subdomainName, campaignDomain }: BuildCampaignDetailPathOptions = {},
): string => {
  if (subdomainName && campaignDomain) {
    const slug = toCampaignSlug(subdomainName, campaignDomain);
    if (slug) {
      return sanitizeSegment(slug);
    }
  }

  return sanitizeSegment(campaignId);
};

/**
 * Build the local app route for displaying a campaign. Prefers the campaign's
 * SuiNS subdomain (sans domain suffix) when available, otherwise falls back to
 * the on-chain object ID.
 */
export function buildCampaignDetailPath(
  campaignId: string,
  options: BuildCampaignDetailPathOptions = {},
): string {
  const segment = resolveCampaignSegment(campaignId, options);
  return `${CAMPAIGNS_PREFIX}/${segment}`;
}

export function buildCampaignEditPath(
  campaignId: string,
  options: BuildCampaignDetailPathOptions = {},
): string {
  const segment = resolveCampaignSegment(campaignId, options);
  return `${CAMPAIGNS_PREFIX}/${segment}/edit`;
}

export function buildCampaignAddUpdatePath(
  campaignId: string,
  options: BuildCampaignDetailPathOptions = {},
): string {
  const segment = resolveCampaignSegment(campaignId, options);
  return `${CAMPAIGNS_PREFIX}/${segment}/add-update`;
}

export function buildProfileDetailPath(profileAddress: string): string {
  return `/profile/${sanitizeSegment(profileAddress)}`;
}
