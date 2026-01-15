import { buildProfileDetailPath } from "@/shared/utils/routes";
import { toProfileSlug } from "@/shared/utils/subdomain";

interface ResolveProfileLinkOptions {
  address?: string | null;
  subdomainName?: string | null;
  campaignDomain?: string | null;
}

interface ResolvedProfileLink {
  handle: string | null;
  profilePath: string | null;
}

export function resolveProfileLink({
  address,
  subdomainName,
  campaignDomain,
}: ResolveProfileLinkOptions): ResolvedProfileLink {
  const normalizedAddress = address?.trim() ?? "";
  if (!normalizedAddress) {
    return { handle: null, profilePath: null };
  }

  const normalizedSubdomain = subdomainName?.trim() || null;
  const handle = normalizedSubdomain
    ? toProfileSlug(normalizedSubdomain, campaignDomain)
    : null;
  const profilePath = buildProfileDetailPath(normalizedAddress, {
    subdomainName: normalizedSubdomain,
    campaignDomain: campaignDomain ?? null,
  });

  return { handle, profilePath };
}
