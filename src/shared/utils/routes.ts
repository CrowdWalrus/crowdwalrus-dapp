import { ROUTES } from "@/shared/config/routes";
import { toCampaignSlug } from "@/shared/utils/subdomain";

interface BuildCampaignDetailPathOptions {
  subdomainName?: string | null;
  campaignDomain?: string | null;
}

/**
 * Build the local app route for displaying a campaign. Prefers the campaign's
 * SuiNS subdomain (sans domain suffix) when available, otherwise falls back to
 * the on-chain object ID.
 */
export function buildCampaignDetailPath(
  campaignId: string,
  { subdomainName, campaignDomain }: BuildCampaignDetailPathOptions = {},
): string {
  const fallbackId = campaignId?.trim();
  const fallbackPath = ROUTES.CAMPAIGNS_DETAIL.replace(
    ":id",
    fallbackId || "",
  );

  if (!subdomainName || !campaignDomain) {
    return fallbackPath;
  }

  const slug = toCampaignSlug(subdomainName, campaignDomain);
  if (!slug) {
    return fallbackPath;
  }

  return ROUTES.CAMPAIGNS_DETAIL.replace(":id", encodeURIComponent(slug));
}
