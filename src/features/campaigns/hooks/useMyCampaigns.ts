import { useMemo } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import type { SupportedNetwork } from "@/shared/types/network";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import { useAllCampaigns } from "./useAllCampaigns";

export function useMyCampaigns(network: SupportedNetwork = DEFAULT_NETWORK) {
  const account = useCurrentAccount();
  const normalizedAccountAddress = account?.address
    ? normalizeSuiAddress(account.address)
    : null;

  const {
    campaigns: allCampaigns,
    isPending,
    error,
    refetch,
    hasNoCampaigns: hasNoAllCampaigns,
  } = useAllCampaigns(network);

  const campaigns = useMemo(() => {
    if (!normalizedAccountAddress) {
      return [];
    }

    return allCampaigns.filter((campaign) => {
      if (!campaign.creatorAddress) {
        return false;
      }
      return (
        normalizeSuiAddress(campaign.creatorAddress) ===
        normalizedAccountAddress
      );
    });
  }, [allCampaigns, normalizedAccountAddress]);

  const hasNoCampaigns =
    normalizedAccountAddress !== null
      ? !isPending && campaigns.length === 0
      : false;

  return {
    campaigns,
    isPending,
    error,
    refetch,
    accountAddress: account?.address ?? null,
    hasNoCampaigns: hasNoCampaigns || hasNoAllCampaigns,
    isConnected: normalizedAccountAddress !== null,
  };
}
