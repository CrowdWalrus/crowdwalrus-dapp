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
    campaigns,
    isPending,
    error,
    refetch,
    hasNoCampaigns,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAllCampaigns(network, {
    ownerAddress: normalizedAccountAddress,
    enabled: normalizedAccountAddress !== null,
  });

  return {
    campaigns,
    isPending: normalizedAccountAddress !== null ? isPending : false,
    error,
    refetch,
    accountAddress: account?.address ?? null,
    hasNoCampaigns:
      normalizedAccountAddress !== null ? hasNoCampaigns : false,
    isConnected: normalizedAccountAddress !== null,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
