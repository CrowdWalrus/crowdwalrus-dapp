import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSuiClient } from "@mysten/dapp-kit";
import { isValidSuiObjectId, normalizeSuiAddress } from "@mysten/sui/utils";

import { useNetworkVariable } from "@/shared/config/networkConfig";
import { formatSubdomain, extractSubdomainLabel } from "@/shared/utils/subdomain";

type ResolutionSource = "id" | "subdomain";

interface UseResolvedCampaignIdResult {
  campaignId: string | null;
  source: ResolutionSource | null;
  slug: string | null;
  fullName: string | null;
  isLoading: boolean;
  notFound: boolean;
  error: Error | null;
}

/**
 * Resolve a campaign identifier (object ID or SuiNS subdomain) to
 * a canonical Sui object ID so downstream hooks can load data uniformly.
 */
export function useResolvedCampaignId(
  identifier: string | null | undefined,
): UseResolvedCampaignIdResult {
  const suiClient = useSuiClient();
  const campaignDomain = useNetworkVariable("campaignDomain") as
    | string
    | undefined;

  const normalizedInput = identifier?.trim() ?? "";
  const hasIdentifier = normalizedInput.length > 0;
  const looksLikeObjectId = hasIdentifier && isValidSuiObjectId(normalizedInput);

  const directId = useMemo(() => {
    if (!looksLikeObjectId) {
      return null;
    }
    return normalizeSuiAddress(normalizedInput);
  }, [looksLikeObjectId, normalizedInput]);

  const shouldResolve = !directId && hasIdentifier;

  const { slug, fullName } = useMemo(() => {
    if (!shouldResolve) {
      return { slug: null as string | null, fullName: null as string | null };
    }

    const lowerInput = normalizedInput.toLowerCase();

    if (lowerInput.includes(".")) {
      // User provided a full domain; still derive a slug if it matches our domain.
      const derivedSlug =
        campaignDomain &&
        lowerInput.endsWith(`.${campaignDomain.toLowerCase()}`)
          ? extractSubdomainLabel(lowerInput, campaignDomain).toLowerCase()
          : lowerInput;

      return {
        slug: derivedSlug,
        fullName: lowerInput,
      };
    }

    if (campaignDomain) {
      const formatted = formatSubdomain(lowerInput, campaignDomain);
      return {
        slug: lowerInput,
        fullName: formatted.toLowerCase(),
      };
    }

    return {
      slug: lowerInput,
      fullName: lowerInput,
    };
  }, [shouldResolve, normalizedInput, campaignDomain]);

  const {
    data: resolvedAddress,
    error: resolutionError,
    isPending,
  } = useQuery({
    queryKey: [
      "resolve-campaign-id",
      campaignDomain ?? null,
      fullName,
    ],
    queryFn: async () => {
      if (!fullName) {
        return null;
      }
      return await suiClient.resolveNameServiceAddress({ name: fullName });
    },
    enabled: shouldResolve && Boolean(fullName),
    retry: 1,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  const campaignId = useMemo(() => {
    if (directId) {
      return directId;
    }
    if (resolvedAddress) {
      try {
        return normalizeSuiAddress(resolvedAddress);
      } catch (err) {
        console.warn("Failed to normalize resolved campaign address", err);
        return null;
      }
    }
    return null;
  }, [directId, resolvedAddress]);

  const source: ResolutionSource | null = directId
    ? "id"
    : resolvedAddress
      ? "subdomain"
      : null;

  const notFound =
    shouldResolve && !isPending && !resolutionError && resolvedAddress === null;

  const derivedError = (resolutionError as Error) ?? null;
  const finalError =
    derivedError ||
    (shouldResolve && resolvedAddress && !campaignId
      ? new Error("Resolved campaign address is invalid.")
      : null);

  return {
    campaignId,
    source,
    slug: slug ?? null,
    fullName,
    isLoading: shouldResolve ? isPending : false,
    notFound,
    error: finalError,
  };
}
