import { useMemo } from "react";
import { normalizeSuiAddress } from "@mysten/sui/utils";

import { useAllCampaigns } from "./useAllCampaigns";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";

interface UseOwnerCampaignsOptions {
  ownerAddress?: string | null;
  network?: SupportedNetwork;
  enabled?: boolean;
}

export function useOwnerCampaigns({
  ownerAddress,
  network = DEFAULT_NETWORK,
  enabled = true,
}: UseOwnerCampaignsOptions) {
  const normalizedOwner = useMemo(() => {
    if (!ownerAddress) {
      return null;
    }
    try {
      return normalizeSuiAddress(ownerAddress);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[useOwnerCampaigns] Ignoring invalid owner address", {
          ownerAddress,
          error,
        });
      }
      return null;
    }
  }, [ownerAddress]);

  const shouldFetch = Boolean(enabled && normalizedOwner);

  const {
    campaigns,
    isPending,
    error,
    refetch,
    hasNoCampaigns,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAllCampaigns(network, {
    enabled: shouldFetch,
    ownerAddress: normalizedOwner,
  });

  return {
    campaigns,
    isPending: shouldFetch ? isPending : false,
    error: shouldFetch ? error : null,
    refetch,
    hasNoCampaigns: shouldFetch ? hasNoCampaigns : false,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
