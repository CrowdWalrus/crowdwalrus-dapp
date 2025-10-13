import { useMemo } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";

import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import { deriveIsCampaignOwner } from "@/features/campaigns/utils/campaignOwnership";
import { useOwnedCampaignCap } from "./useOwnedCampaignCap";

interface UseCampaignOwnershipOptions {
  campaignId?: string | null;
  network?: "devnet" | "testnet" | "mainnet";
}

interface UseCampaignOwnershipResult {
  isOwner: boolean;
  isOwnershipLoading: boolean;
  ownershipError: Error | null;
  refetchOwnership: () => void;
  ownerCapId: string | null;
  accountAddress: string | null;
}

export function useCampaignOwnership({
  campaignId,
  network = DEFAULT_NETWORK,
}: UseCampaignOwnershipOptions): UseCampaignOwnershipResult {
  const account = useCurrentAccount();
  const normalizedCampaignId = campaignId ? campaignId : null;

  const {
    ownerCapId,
    isLoading,
    error,
    refetch,
  } = useOwnedCampaignCap(normalizedCampaignId ?? "", network);

  const isOwner = useMemo(
    () =>
      deriveIsCampaignOwner({
        currentAccountAddress: account?.address ?? null,
        campaignId: normalizedCampaignId,
        ownerCapId,
      }),
    [account?.address, normalizedCampaignId, ownerCapId],
  );

  return {
    isOwner,
    isOwnershipLoading: isLoading,
    ownershipError: error,
    refetchOwnership: refetch,
    ownerCapId,
    accountAddress: account?.address ?? null,
  };
}
