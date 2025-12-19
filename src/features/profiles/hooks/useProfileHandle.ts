import { useMemo } from "react";

import { useProfileIdentity } from "@/hooks/indexer/useProfileIdentity";
import { useNetworkVariable } from "@/shared/config/networkConfig";
import { buildProfileDetailPath } from "@/shared/utils/routes";
import { toProfileSlug } from "@/shared/utils/subdomain";

interface UseProfileHandleResult {
  handle: string | null;
  subdomainName: string | null;
  profilePath: string | null;
  isFetching: boolean;
}

export function useProfileHandle(
  ownerAddress: string | null | undefined,
): UseProfileHandleResult {
  const campaignDomain = useNetworkVariable("campaignDomain") as
    | string
    | undefined;
  const normalizedAddress = ownerAddress?.trim() ?? "";
  const hasAddress =
    normalizedAddress.length >= 10 && normalizedAddress.startsWith("0x");

  const identityQuery = useProfileIdentity({
    address: hasAddress ? normalizedAddress : null,
    enabled: hasAddress,
  });

  const subdomainName = identityQuery.data?.subdomainName ?? null;

  const handle = useMemo(() => {
    if (!subdomainName) {
      return null;
    }

    const normalized = toProfileSlug(subdomainName, campaignDomain);
    return normalized.length > 0 ? normalized : null;
  }, [campaignDomain, subdomainName]);

  const profilePath = useMemo(() => {
    if (!hasAddress) {
      return null;
    }

    return buildProfileDetailPath(normalizedAddress, {
      subdomainName,
      campaignDomain: campaignDomain ?? null,
    });
  }, [campaignDomain, hasAddress, normalizedAddress, subdomainName]);

  return {
    handle,
    subdomainName,
    profilePath,
    isFetching: Boolean(hasAddress && identityQuery.isFetching),
  };
}
