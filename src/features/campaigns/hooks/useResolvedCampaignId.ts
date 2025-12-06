import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  resolveCampaignIdentifier,
  getSubdomainByName,
  IndexerHttpError,
  type CampaignResolutionResponse,
} from "@/services/indexer-services";
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
    data: resolution,
    error: resolutionError,
    isPending,
  } = useQuery({
    queryKey: ["indexer", "campaign-resolution", slug],
    queryFn: async () => {
      if (!slug) return null;

      // Primary: dedicated resolver (works on new indexer)
      try {
        return await resolveCampaignIdentifier(slug);
      } catch (error) {
        const asHttpError = error instanceof IndexerHttpError ? error : null;

        // Fallback: older indexer versions only expose /subdomains/{name}
        if (asHttpError?.status === 404) {
          try {
            const sub = await getSubdomainByName(slug);
            return sub
              ? ({
                  campaignId: sub.campaignId,
                  subdomainName: sub.subdomainName,
                  resolvedVia: "subdomain_registry",
                } as CampaignResolutionResponse)
              : null;
          } catch (subErr) {
            const subHttpErr = subErr instanceof IndexerHttpError ? subErr : null;
            if (subHttpErr?.status === 404) {
              return null;
            }
            throw subErr as Error;
          }
        }

        throw error as Error;
      }
    },
    enabled: Boolean(shouldResolve && slug),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const campaignId = useMemo(() => {
    if (directId) return directId;
    if (resolution?.campaignId) {
      try {
        return normalizeSuiAddress(resolution.campaignId);
      } catch (err) {
        console.warn("Failed to normalize campaign id from resolution", err);
        return resolution.campaignId;
      }
    }
    return null;
  }, [directId, resolution?.campaignId]);

  const source: ResolutionSource | null = directId
    ? "id"
    : resolution?.campaignId
      ? "subdomain"
      : null;

  const notFound =
    shouldResolve && !isPending && !resolutionError && !resolution;

  const finalError = (resolutionError as Error) ?? null;

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
