import { useCallback, useState } from "react";
import {
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { toast } from "sonner";

import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";
import { buildToggleActiveTransaction } from "@/services/campaign-transaction";

export type DeactivateCampaignResult =
  | "success"
  | "already_inactive"
  | "missing_campaign"
  | "missing_wallet"
  | "missing_owner_cap"
  | "user_rejected"
  | "error";

export interface UseDeactivateCampaignOptions {
  campaignId?: string | null;
  ownerCapId?: string | null;
  isActive?: boolean;
  accountAddress?: string | null;
  network?: SupportedNetwork;
  onSuccess?: () => Promise<void> | void;
  onError?: (error: Error) => void;
}

const isUserRejectedError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("user rejected") ||
    message.includes("rejected the request") ||
    message.includes("user cancelled") ||
    message.includes("user canceled") ||
    message.includes("request rejected")
  );
};

export function useDeactivateCampaign({
  campaignId,
  ownerCapId,
  isActive,
  accountAddress,
  network = DEFAULT_NETWORK,
  onSuccess,
  onError,
}: UseDeactivateCampaignOptions) {
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

  const deactivateCampaign = useCallback(async (): Promise<DeactivateCampaignResult> => {
    if (!campaignId) {
      toast.error("Campaign ID is required to deactivate.");
      return "missing_campaign";
    }

    if (!isActive) {
      toast.info("This campaign is already deactivated.");
      return "already_inactive";
    }

    if (!accountAddress) {
      toast.error("Connect your wallet to deactivate this campaign.");
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
        false,
        network,
      );

      await signAndExecuteTransaction({
        transaction,
        chain: `sui:${network}`,
      });

      toast.success("Campaign deactivated successfully.");
      await onSuccess?.();

      return "success";
    } catch (error) {
      console.error("Failed to deactivate campaign:", error);

      if (isUserRejectedError(error)) {
        toast.info("Transaction cancelled. Campaign remains active.");
        return "user_rejected";
      }

      const err =
        error instanceof Error
          ? error
          : new Error("Failed to deactivate campaign.");

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
    deactivateCampaign,
    isProcessing,
  };
}
