import { useCallback, useState } from "react";
import {
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { toast } from "sonner";

import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";
import { buildUnverifyCampaignTransaction } from "@/services/campaign-transaction";

export type UnverifyCampaignResult =
  | "success"
  | "already_unverified"
  | "missing_campaign"
  | "missing_wallet"
  | "missing_verify_cap"
  | "user_rejected"
  | "error";

export interface UseUnverifyCampaignOptions {
  campaignId?: string | null;
  verifyCapId?: string | null;
  accountAddress?: string | null;
  isVerified?: boolean;
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

export function useUnverifyCampaign({
  campaignId,
  verifyCapId,
  accountAddress,
  isVerified,
  network = DEFAULT_NETWORK,
  onSuccess,
  onError,
}: UseUnverifyCampaignOptions) {
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

  const unverifyCampaign = useCallback(async (): Promise<UnverifyCampaignResult> => {
    if (!campaignId) {
      toast.error("Campaign ID is required to unverify.");
      return "missing_campaign";
    }

    if (!accountAddress) {
      toast.error("Connect your wallet to unverify campaigns.");
      return "missing_wallet";
    }

    if (!verifyCapId) {
      toast.error("This wallet is missing a CrowdWalrus VerifyCap.");
      return "missing_verify_cap";
    }

    if (isVerified === false) {
      toast.info("Campaign is already unverified.");
      return "already_unverified";
    }

    setIsProcessing(true);

    try {
      const transaction = buildUnverifyCampaignTransaction(
        campaignId,
        verifyCapId,
        network,
      );

      await signAndExecuteTransaction({
        transaction,
        chain: `sui:${network}`,
      });

      toast.success("Campaign unverified successfully.");
      await onSuccess?.();

      return "success";
    } catch (error) {
      console.error("Failed to unverify campaign:", error);

      if (isUserRejectedError(error)) {
        toast.info("Transaction cancelled. Campaign remains verified.");
        return "user_rejected";
      }

      const err =
        error instanceof Error
          ? error
          : new Error("Failed to unverify campaign.");

      toast.error(err.message);
      onError?.(err);

      return "error";
    } finally {
      setIsProcessing(false);
    }
  }, [
    campaignId,
    accountAddress,
    verifyCapId,
    isVerified,
    network,
    signAndExecuteTransaction,
    onSuccess,
    onError,
  ]);

  return {
    unverifyCampaign,
    isProcessing,
  };
}
