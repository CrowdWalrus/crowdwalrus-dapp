import { useCallback, useState } from "react";
import {
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { toast } from "sonner";

import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";
import { buildDeleteCampaignTransaction } from "@/services/campaign-transaction";
import { isUserRejectedError } from "@/shared/utils/errors";

export type DeleteCampaignResult =
  | "success"
  | "missing_campaign"
  | "missing_wallet"
  | "missing_owner_cap"
  | "already_deleted"
  | "user_rejected"
  | "error";

export interface UseDeleteCampaignOptions {
  campaignId?: string | null;
  ownerCapId?: string | null;
  isDeleted?: boolean;
  accountAddress?: string | null;
  network?: SupportedNetwork;
  onSuccess?: () => Promise<void> | void;
  onError?: (error: Error) => void;
}

export function useDeleteCampaign({
  campaignId,
  ownerCapId,
  isDeleted,
  accountAddress,
  network = DEFAULT_NETWORK,
  onSuccess,
  onError,
}: UseDeleteCampaignOptions) {
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

  const deleteCampaign = useCallback(async (): Promise<DeleteCampaignResult> => {
    if (!campaignId) {
      toast.error("Campaign ID is required to delete.");
      return "missing_campaign";
    }

    if (isDeleted) {
      toast.info("This campaign has already been deleted.");
      return "already_deleted";
    }

    if (!accountAddress) {
      toast.error("Connect your wallet to delete this campaign.");
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
      const transaction = buildDeleteCampaignTransaction(
        campaignId,
        ownerCapId,
        network,
      );

      await signAndExecuteTransaction({
        transaction,
        chain: `sui:${network}`,
      });

      toast.success("Campaign deleted permanently.");
      await onSuccess?.();

      return "success";
    } catch (error) {
      console.error("Failed to delete campaign:", error);

      if (isUserRejectedError(error)) {
        toast.info("Transaction cancelled. Campaign was not deleted.");
        return "user_rejected";
      }

      const err =
        error instanceof Error
          ? error
          : new Error("Failed to delete campaign.");

      toast.error(err.message);
      onError?.(err);

      return "error";
    } finally {
      setIsProcessing(false);
    }
  }, [
    campaignId,
    isDeleted,
    accountAddress,
    ownerCapId,
    network,
    signAndExecuteTransaction,
    onSuccess,
    onError,
  ]);

  return {
    deleteCampaign,
    isProcessing,
  };
}
