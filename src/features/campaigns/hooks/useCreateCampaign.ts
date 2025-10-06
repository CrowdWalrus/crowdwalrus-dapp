/**
 * Campaign Creation Utility Hooks
 *
 * This file provides utility hooks for campaign creation:
 * - useEstimateStorageCost() - Estimate Walrus storage costs
 */

import { useMutation } from "@tanstack/react-query";
import { useSuiClient } from "@mysten/dapp-kit";
import type { CampaignFormData } from "@/features/campaigns/types/campaign";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";

/**
 * Hook to get storage cost estimate
 * Useful for displaying cost before campaign creation
 */
export function useEstimateStorageCost() {
  const suiClient = useSuiClient();
  const network = DEFAULT_NETWORK;

  return useMutation({
    mutationFn: async ({
      formData,
      epochs,
    }: {
      formData: CampaignFormData;
      epochs?: number;
    }) => {
      const { calculateStorageCost } = await import("@/services/walrus");
      return calculateStorageCost(suiClient, network, formData, epochs);
    },
  });
}
