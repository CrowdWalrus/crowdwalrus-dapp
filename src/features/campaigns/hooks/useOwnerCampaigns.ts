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
    campaigns: allCampaigns,
    isPending,
    error,
    refetch,
  } = useAllCampaigns(network, { enabled: shouldFetch });

  const campaigns = useMemo(() => {
    if (!shouldFetch || !normalizedOwner) {
      return [];
    }

    return allCampaigns.filter((campaign) => {
      if (!campaign.creatorAddress) {
        return false;
      }

      try {
        return (
          normalizeSuiAddress(campaign.creatorAddress) === normalizedOwner
        );
      } catch {
        return false;
      }
    });
  }, [allCampaigns, normalizedOwner, shouldFetch]);

  const hasNoCampaigns = shouldFetch
    ? !isPending && campaigns.length === 0
    : false;

  return {
    campaigns,
    isPending: shouldFetch ? isPending : false,
    error: shouldFetch ? error : null,
    refetch,
    hasNoCampaigns,
  };
}
