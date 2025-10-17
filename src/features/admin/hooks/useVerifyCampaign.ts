import { useCallback, useState } from "react";
import {
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { toast } from "sonner";

import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";
import { buildVerifyCampaignTransaction } from "@/services/campaign-transaction";

export type VerifyCampaignResult =
  | "success"
  | "already_verified"
  | "missing_campaign"
  | "missing_wallet"
  | "missing_verify_cap"
  | "user_rejected"
  | "error";

export interface UseVerifyCampaignOptions {
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

export function useVerifyCampaign({
  campaignId,
  verifyCapId,
  accountAddress,
  isVerified,
  network = DEFAULT_NETWORK,
  onSuccess,
  onError,
}: UseVerifyCampaignOptions) {
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

  const verifyCampaign = useCallback(async (): Promise<VerifyCampaignResult> => {
    if (!campaignId) {
      toast.error("Campaign ID is required to verify.");
      return "missing_campaign";
    }

    if (!accountAddress) {
      toast.error("Connect your wallet to verify campaigns.");
      return "missing_wallet";
    }

    if (!verifyCapId) {
      toast.error("This wallet is missing a CrowdWalrus VerifyCap.");
      return "missing_verify_cap";
    }

    if (isVerified) {
      toast.info("Campaign is already verified.");
      return "already_verified";
    }

    setIsProcessing(true);

    try {
      const transaction = buildVerifyCampaignTransaction(
        campaignId,
        verifyCapId,
        network,
      );

      await signAndExecuteTransaction({
        transaction,
        chain: `sui:${network}`,
      });

      toast.success("Campaign verified successfully.");
      await onSuccess?.();

      return "success";
    } catch (error) {
      console.error("Failed to verify campaign:", error);

      if (isUserRejectedError(error)) {
        toast.info("Transaction cancelled. Campaign remains unverified.");
        return "user_rejected";
      }

      const err =
        error instanceof Error
          ? error
          : new Error("Failed to verify campaign.");

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
    verifyCampaign,
    isProcessing,
  };
}
