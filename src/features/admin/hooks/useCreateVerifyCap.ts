import { useCallback, useState } from "react";
import {
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { toast } from "sonner";

import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import { buildCreateVerifyCapTransaction } from "@/services/campaign-transaction";

type SupportedNetwork = "devnet" | "testnet" | "mainnet";

export type CreateVerifyCapResult =
  | "success"
  | "missing_wallet"
  | "missing_admin_cap"
  | "invalid_verifier_address"
  | "user_rejected"
  | "error";

export interface UseCreateVerifyCapOptions {
  adminCapId?: string | null;
  accountAddress?: string | null;
  network?: SupportedNetwork;
  onSuccess?: (verifierAddress: string) => Promise<void> | void;
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

const isValidSuiAddress = (address: string) =>
  /^0x[a-fA-F0-9]{1,64}$/.test(address.trim());

export function useCreateVerifyCap({
  adminCapId,
  accountAddress,
  network = DEFAULT_NETWORK,
  onSuccess,
  onError,
}: UseCreateVerifyCapOptions) {
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

  const createVerifyCap = useCallback(
    async (newVerifierAddress: string): Promise<CreateVerifyCapResult> => {
      const normalizedAddress = newVerifierAddress?.trim() ?? "";

      if (!accountAddress) {
        toast.error("Connect your wallet to manage verifier access.");
        return "missing_wallet";
      }

      if (!adminCapId) {
        toast.error("Admin capability is required to create a verifier.");
        return "missing_admin_cap";
      }

      if (!normalizedAddress || !isValidSuiAddress(normalizedAddress)) {
        toast.error("Enter a valid Sui address (e.g., 0x123...).");
        return "invalid_verifier_address";
      }

      setIsProcessing(true);

      try {
        const transaction = buildCreateVerifyCapTransaction(
          adminCapId,
          normalizedAddress,
          network,
        );

        await signAndExecuteTransaction({
          transaction,
          chain: `sui:${network}`,
        });

        toast.success("Verifier access granted successfully.");
        await onSuccess?.(normalizedAddress);

        return "success";
      } catch (error) {
        console.error("Failed to create verify cap:", error);

        if (isUserRejectedError(error)) {
          toast.info("Transaction cancelled. No verifier was created.");
          return "user_rejected";
        }

        const err =
          error instanceof Error
            ? error
            : new Error("Failed to create verify cap.");

        toast.error(err.message);
        onError?.(err);

        return "error";
      } finally {
        setIsProcessing(false);
      }
    },
    [
      accountAddress,
      adminCapId,
      network,
      signAndExecuteTransaction,
      onSuccess,
      onError,
    ],
  );

  return {
    createVerifyCap,
    isProcessing,
  };
}
