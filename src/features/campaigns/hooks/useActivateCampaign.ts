import { useCallback, useState } from "react";
import {
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { toast } from "sonner";

import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";
import { buildToggleActiveTransaction } from "@/services/campaign-transaction";
import { isUserRejectedError } from "@/shared/utils/errors";

export type ActivateCampaignResult =
  | "success"
  | "already_active"
  | "missing_campaign"
  | "missing_wallet"
  | "missing_owner_cap"
  | "user_rejected"
  | "error";

export interface UseActivateCampaignOptions {
  campaignId?: string | null;
  ownerCapId?: string | null;
  isActive?: boolean;
  accountAddress?: string | null;
  network?: SupportedNetwork;
  onSuccess?: () => Promise<void> | void;
  onError?: (error: Error) => void;
}

export function useActivateCampaign({
  campaignId,
  ownerCapId,
  isActive,
  accountAddress,
  network = DEFAULT_NETWORK,
  onSuccess,
  onError,
}: UseActivateCampaignOptions) {
  const suiClient = useSuiClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction({
      execute: async ({ bytes, signature }) =>
        await suiClient.executeTransactionBlock({
          transactionBlock: bytes,
          signature,
          options: {
            showEffects: true,
            showObjectChanges: true,
            showRawEffects: true,
          },
        }),
    });

  const activateCampaign = useCallback(async (): Promise<ActivateCampaignResult> => {
    if (!campaignId) {
      toast.error("Campaign ID is required to activate.");
      return "missing_campaign";
    }

    if (isActive) {
      toast.info("This campaign is already active.");
      return "already_active";
    }

    if (!accountAddress) {
      toast.error("Connect your wallet to activate this campaign.");
      return "missing_wallet";
    }

    if (!ownerCapId) {
      toast.error(
        "Unable to locate the campaign ownership capability for this account.",
      );
      return "missing_owner_cap";
    }

    setIsProcessing(true);

    try {
      const transaction = buildToggleActiveTransaction(
        campaignId,
        ownerCapId,
        true,
        network,
      );

      await signAndExecuteTransaction({
        transaction,
        chain: `sui:${network}`,
      });

      toast.success("Campaign activated successfully.");
      await onSuccess?.();

      return "success";
    } catch (error) {
      console.error("Failed to activate campaign:", error);

      if (isUserRejectedError(error)) {
        toast.info("Transaction cancelled. Campaign remains inactive.");
        return "user_rejected";
      }

      const err =
        error instanceof Error
          ? error
          : new Error("Failed to activate campaign.");

      toast.error(err.message);
      onError?.(err);

      return "error";
    } finally {
      setIsProcessing(false);
    }
  }, [
    campaignId,
    isActive,
    accountAddress,
    ownerCapId,
    network,
    signAndExecuteTransaction,
    onSuccess,
    onError,
  ]);

  return {
    activateCampaign,
    isProcessing,
  };
}
