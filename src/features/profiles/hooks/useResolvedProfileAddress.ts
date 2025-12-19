import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { isValidSuiAddress, normalizeSuiAddress } from "@mysten/sui/utils";

import {
  IndexerHttpError,
  resolveProfileIdentifier,
  type ProfileResolutionResponse,
} from "@/services/indexer-services";
import { useNetworkVariable } from "@/shared/config/networkConfig";
import { extractSubdomainLabel, formatSubdomain } from "@/shared/utils/subdomain";

type ResolutionSource = "address" | "subname";

interface UseResolvedProfileAddressResult {
  ownerAddress: string | null;
  source: ResolutionSource | null;
  slug: string | null;
  fullName: string | null;
  isLoading: boolean;
  notFound: boolean;
  error: Error | null;
}

function normalizeAddressSafely(value: string): string | null {
  try {
    const normalized = normalizeSuiAddress(value.trim());
    return isValidSuiAddress(normalized) ? normalized : null;
  } catch {
    return null;
  }
}

function mapResolvedOwner(response: ProfileResolutionResponse): string {
  try {
    return normalizeSuiAddress(response.owner);
  } catch {
    return response.owner;
  }
}

/**
 * Resolve a profile identifier (Sui address or SuiNS sub-name label) to a canonical owner address.
 */
export function useResolvedProfileAddress(
  identifier: string | null | undefined,
): UseResolvedProfileAddressResult {
  const campaignDomain = useNetworkVariable("campaignDomain") as
    | string
    | undefined;

  const normalizedInput = identifier?.trim() ?? "";
  const hasIdentifier = normalizedInput.length > 0;

  const directAddress = useMemo(() => {
    if (!hasIdentifier) {
      return null;
    }

    return normalizeAddressSafely(normalizedInput);
  }, [hasIdentifier, normalizedInput]);

  const shouldResolve = !directAddress && hasIdentifier;

  const { slug, fullName } = useMemo(() => {
    if (!shouldResolve) {
      return { slug: null as string | null, fullName: null as string | null };
    }

    const lowerInput = normalizedInput.toLowerCase();

    if (lowerInput.includes("@")) {
      const derivedSlug = lowerInput.split("@")[0] ?? lowerInput;
      return {
        slug: derivedSlug,
        fullName: lowerInput,
      };
    }

    if (lowerInput.includes(".")) {
      const derivedSlug =
        campaignDomain &&
        lowerInput.endsWith(`.${campaignDomain.toLowerCase()}`)
          ? extractSubdomainLabel(lowerInput, campaignDomain).toLowerCase()
          : (lowerInput.split(".")[0] ?? lowerInput);

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
    queryKey: ["indexer", "profile-resolution", slug],
    queryFn: async () => {
      if (!slug) {
        return null;
      }

      try {
        return await resolveProfileIdentifier(slug);
      } catch (error) {
        if (error instanceof IndexerHttpError && error.status === 404) {
          return null;
        }
        throw error as Error;
      }
    },
    enabled: Boolean(shouldResolve && slug),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const ownerAddress = useMemo(() => {
    if (directAddress) {
      return directAddress;
    }
    if (resolution?.owner) {
      return mapResolvedOwner(resolution);
    }
    return null;
  }, [directAddress, resolution]);

  const source: ResolutionSource | null = directAddress
    ? "address"
    : resolution?.owner
      ? "subname"
      : null;

  const notFound =
    shouldResolve && !isPending && !resolutionError && !resolution;

  return {
    ownerAddress,
    source,
    slug: slug ?? null,
    fullName,
    isLoading: shouldResolve ? isPending : false,
    notFound,
    error: (resolutionError as Error) ?? null,
  };
}
