/**
 * Walrus Upload Hook
 *
 * Single hook that provides all Walrus upload operations:
 * - prepare: Encode files and prepare upload flow
 * - register: Register blob on blockchain (1st transaction - costs WAL)
 * - upload: Upload data to Walrus storage nodes
 * - certify: Certify blob on blockchain (2nd transaction)
 *
 * This allows page-level control with user confirmations between steps.
 */

import { useMutation } from "@tanstack/react-query";
import { useSuiClient, useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { WalrusFile, type WriteFilesFlow } from "@mysten/walrus";
import {
  createWalrusClient,
  prepareCampaignFiles,
  createWalrusUploadFlow,
  buildRegisterTransaction,
  uploadToWalrusNodes,
  buildCertifyTransaction,
  getUploadedFilesInfo,
} from "@/services/walrus";
import type { CampaignFormData } from "@/features/campaigns/types/campaign";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import { getContractConfig } from "@/shared/config/contracts";

/**
 * Walrus flow state that's passed between steps
 *
 * Contains the WriteFilesFlow object returned by walrusClient.writeFilesFlow()
 * which provides methods for encode/register/upload/certify operations.
 */
export interface WalrusFlowState {
  flow: WriteFilesFlow;
  files: WalrusFile[];
  storageEpochs: number;
  network: "devnet" | "testnet" | "mainnet";
}

/**
 * Result from registration step
 */
export interface RegisterResult {
  transactionDigest: string;
  flowState: WalrusFlowState;
}

/**
 * Result from certification step
 */
export interface CertifyResult {
  blobId: string;
  cost: string;
  storageEpochs: number;
}

/**
 * Main Walrus upload hook - provides all upload operations
 */
export function useWalrusUpload() {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  /**
   * Step 1: Prepare and encode files for Walrus upload
   */
  const prepare = useMutation<WalrusFlowState, Error, { formData: CampaignFormData; network?: string; storageEpochs?: number }>({
    mutationFn: async ({ formData, network = DEFAULT_NETWORK, storageEpochs }) => {
      const config = getContractConfig(network as any);
      const epochs = storageEpochs || config.storageDefaults.defaultEpochs;

      const files = await prepareCampaignFiles(formData);
      const walrusClient = createWalrusClient(suiClient, network as any);
      const flow = await createWalrusUploadFlow(walrusClient, files);

      return {
        flow,
        files,
        storageEpochs: epochs,
        network: network as any,
      };
    },
  });

  /**
   * Step 2: Register blob on blockchain (costs WAL tokens)
   */
  const register = useMutation<RegisterResult, Error, WalrusFlowState>({
    mutationFn: async (flowState) => {
      if (!currentAccount) {
        throw new Error("Wallet not connected");
      }

      const registerTx = buildRegisterTransaction(
        flowState.flow,
        flowState.storageEpochs,
        currentAccount.address
      );

      try {
        const result = await signAndExecute({
          transaction: registerTx,
          chain: `sui:${flowState.network}`,
        });

        if (!result) {
          throw new Error("Failed to register blob: No result returned");
        }

        return {
          transactionDigest: result.digest,
          flowState,
        };
      } catch (error) {
        if (error instanceof Error) {
          const isInsufficientBalance =
            error.message.includes("Not enough coins") ||
            error.message.includes("Insufficient") ||
            error.stack?.includes("loadMoreCoins");

          const isWalToken =
            error.message.includes("WAL") ||
            error.message.includes("wal::WAL");

          if (isInsufficientBalance && isWalToken) {
            throw new Error("Insufficient WAL balance to register storage");
          }
        }
        throw error;
      }
    },
  });

  /**
   * Step 3: Upload data to Walrus storage nodes (no transaction)
   */
  const upload = useMutation<WalrusFlowState, Error, { flowState: WalrusFlowState; registerDigest: string }>({
    mutationFn: async ({ flowState, registerDigest }) => {
      await uploadToWalrusNodes(flowState.flow, registerDigest);
      return flowState;
    },
  });

  /**
   * Step 4: Certify blob on blockchain (transaction)
   */
  const certify = useMutation<CertifyResult, Error, WalrusFlowState>({
    mutationFn: async (flowState) => {
      const certifyTx = buildCertifyTransaction(flowState.flow);

      const result = await signAndExecute({
        transaction: certifyTx,
        chain: `sui:${flowState.network}`,
      });

      if (!result) {
        throw new Error("Failed to certify blob: No result returned");
      }

      const uploadResult = await getUploadedFilesInfo(
        flowState.flow,
        flowState.files,
        flowState.storageEpochs
      );

      return {
        blobId: uploadResult.blobId,
        cost: uploadResult.cost,
        storageEpochs: flowState.storageEpochs,
      };
    },
  });

  return {
    prepare,
    register,
    upload,
    certify,
  };
}
