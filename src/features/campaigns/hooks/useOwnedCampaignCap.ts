import { useMemo } from "react";
import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";

import { getContractConfig } from "@/shared/config/contracts";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";

interface UseOwnedCampaignCapResult {
  ownerCapId: string | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useOwnedCampaignCap(
  campaignId: string,
  network: "devnet" | "testnet" | "mainnet" = DEFAULT_NETWORK,
): UseOwnedCampaignCapResult {
  const account = useCurrentAccount();
  const config = getContractConfig(network);
  const enabled = Boolean(account?.address) && Boolean(campaignId);

  const {
    data,
    isPending,
    error,
    refetch,
  } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address as string,
      filter: {
        StructType: `${config.contracts.packageId}::campaign::CampaignOwnerCap`,
      },
      options: {
        showContent: true,
      },
    },
    {
      enabled,
    },
  );

  const ownerCapId = useMemo(() => {
    if (!data?.data || !campaignId) {
      return null;
    }

    for (const item of data.data) {
      const objectData = item.data;
      const content: any = objectData?.content;
      if (!content || content.dataType !== "moveObject") {
        continue;
      }

      const fields = content.fields as {
        campaign_id?: string;
        campaignId?: string;
        id?: { id?: string };
      };
      const capCampaignId = fields?.campaign_id ?? fields?.campaignId;

      if (capCampaignId === campaignId) {
        return objectData?.objectId ?? fields?.id?.id ?? null;
      }
    }

    return null;
  }, [data, campaignId]);

  return {
    ownerCapId,
    isLoading: isPending,
    error: (error as Error) ?? null,
    refetch,
  };
}
