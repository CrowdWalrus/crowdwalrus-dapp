import { useMemo } from "react";
import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";

import { getContractConfig } from "@/shared/config/contracts";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";

interface UseOwnedCampaignCapResult {
  ownerCapId: string | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface CampaignOwnerCapFields {
  campaign_id?: string;
  campaignId?: string;
  id?: { id?: string };
}

const isCampaignOwnerCapContent = (
  content: unknown,
): content is { dataType: "moveObject"; fields?: CampaignOwnerCapFields } =>
  typeof content === "object" &&
  content !== null &&
  (content as { dataType?: unknown }).dataType === "moveObject";

export function useOwnedCampaignCap(
  campaignId: string,
  network: SupportedNetwork = DEFAULT_NETWORK,
): UseOwnedCampaignCapResult {
  const account = useCurrentAccount();
  const config = getContractConfig(network);
  const enabled = Boolean(account?.address) && Boolean(campaignId);
  const ownerAddress = account?.address ?? "";

  const {
    data,
    isPending,
    error,
    refetch,
  } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: ownerAddress,
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
      const content = objectData?.content;
      if (!isCampaignOwnerCapContent(content)) {
        continue;
      }

      const fields: CampaignOwnerCapFields = content.fields ?? {};
      const capCampaignId = fields.campaign_id ?? fields.campaignId;

      if (capCampaignId === campaignId) {
        return objectData?.objectId ?? fields.id?.id ?? null;
      }
    }

    return null;
  }, [data, campaignId]);

  return {
    ownerCapId,
    isLoading: isPending,
    error: error instanceof Error ? error : null,
    refetch,
  };
}
