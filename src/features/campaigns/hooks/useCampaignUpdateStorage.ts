import { useMutation } from "@tanstack/react-query";
import { useSuiClient } from "@mysten/dapp-kit";

import type { CampaignUpdateStorageData } from "@/features/campaigns/types/campaignUpdate";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";

export function useEstimateUpdateStorageCost() {
  const suiClient = useSuiClient();
  const network = DEFAULT_NETWORK;

  return useMutation({
    mutationFn: async ({
      data,
      epochs,
    }: {
      data: CampaignUpdateStorageData;
      epochs?: number;
    }) => {
      const { calculateUpdateStorageCost } = await import("@/services/walrus");
      return calculateUpdateStorageCost(suiClient, network, data, epochs);
    },
  });
}
