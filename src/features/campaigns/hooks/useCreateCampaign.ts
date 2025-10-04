/**
 * Campaign Creation Utility Hooks
 *
 * This file provides utility hooks for campaign creation:
 * - useEstimateStorageCost() - Estimate Walrus storage costs
 * - useCheckSufficientBalance() - Check if user has sufficient balance
 */

import { useMutation } from "@tanstack/react-query";
import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
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

/**
 * Helper hook to check if user has sufficient balance
 */
export function useCheckSufficientBalance() {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();

  return useMutation({
    mutationFn: async (requiredAmount: string) => {
      if (!currentAccount) {
        return { sufficient: false, balance: "0", required: requiredAmount };
      }

      try {
        const balance = await suiClient.getBalance({
          owner: currentAccount.address,
        });

        const balanceInSui = parseFloat(balance.totalBalance) / 1_000_000_000; // Convert MIST to SUI
        const required = parseFloat(requiredAmount);

        return {
          sufficient: balanceInSui >= required,
          balance: balanceInSui.toFixed(6),
          required: required.toFixed(6),
        };
      } catch (error) {
        console.error("Error checking balance:", error);
        return { sufficient: false, balance: "0", required: requiredAmount };
      }
    },
  });
}
