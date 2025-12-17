import { toCampaignSlug, toProfileSlug } from "@/shared/utils/subdomain";

interface BuildCampaignDetailPathOptions {
  subdomainName?: string | null;
  campaignDomain?: string | null;
}

const CAMPAIGNS_PREFIX = "/campaigns";
const PROFILE_PREFIX = "/profile";

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

interface BuildProfileDetailPathOptions {
  subdomainName?: string | null;
  campaignDomain?: string | null;
}

const resolveProfileSegment = (
  profileAddress: string,
  { subdomainName, campaignDomain }: BuildProfileDetailPathOptions = {},
): string => {
  if (subdomainName) {
    const slug = toProfileSlug(subdomainName, campaignDomain);
    if (slug) {
      return sanitizeSegment(slug);
    }
  }

  return sanitizeSegment(profileAddress);
};

export function buildProfileDetailPath(
  profileAddress: string,
  options: BuildProfileDetailPathOptions = {},
): string {
  const segment = resolveProfileSegment(profileAddress, options);
  return `${PROFILE_PREFIX}/${segment}`;
}
