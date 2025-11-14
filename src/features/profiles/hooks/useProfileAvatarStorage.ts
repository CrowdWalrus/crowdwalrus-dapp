import { useMutation } from "@tanstack/react-query";
import { useSuiClient } from "@mysten/dapp-kit";

import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";

interface EstimateAvatarCostArgs {
  file: File;
  epochs?: number;
}

/**
 * React Query mutation that estimates Walrus storage costs for a profile avatar image.
 *
 * The hook wraps `calculateProfileAvatarStorageCost` so UI code can trigger
 * asynchronous estimates (including subsidies) whenever a user selects or recrops
 * their profile photo. Results include the detailed cost breakdown consumed by the
 * storage registration card/componentry.
 */
export function useEstimateProfileAvatarCost() {
  const suiClient = useSuiClient();
  const network = DEFAULT_NETWORK;

  return useMutation({
    mutationFn: async ({ file, epochs }: EstimateAvatarCostArgs) => {
      const { calculateProfileAvatarStorageCost } = await import(
        "@/services/walrus"
      );
      return calculateProfileAvatarStorageCost(suiClient, network, file, epochs);
    },
  });
}
