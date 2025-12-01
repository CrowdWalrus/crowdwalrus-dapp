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
  prepareCampaignUpdateFiles,
  prepareProfileAvatarFile,
  createWalrusUploadFlow,
  buildRegisterTransaction,
  uploadToWalrusNodes,
  buildCertifyTransaction,
  getUploadedFilesInfo,
} from "@/services/walrus";
import type { CampaignFormData } from "@/features/campaigns/types/campaign";
import type { CampaignUpdateStorageData } from "@/features/campaigns/types/campaignUpdate";
import { DEFAULT_NETWORK, WALRUS_EPOCH_CONFIG } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";

/**
 * Walrus flow state that's passed between steps
 *
 * Contains the WriteFilesFlow object returned by walrusClient.writeFilesFlow()
 * which provides methods for encode/register/upload/certify operations.
 */
interface WalrusFlowContext {
  profileAvatarIdentifier?: string;
  profileAvatarMimeType?: string;
}

export interface WalrusFlowState {
  flow: WriteFilesFlow;
  files: WalrusFile[];
  storageEpochs: number;
  network: SupportedNetwork;
  purpose: "campaign" | "campaign-update" | "profile-avatar";
  context?: WalrusFlowContext;
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
  type PrepareArgs =
    | {
        purpose?: "campaign";
        formData: CampaignFormData;
        update?: undefined;
        avatar?: undefined;
        network?: SupportedNetwork;
        storageEpochs?: number;
      }
    | {
        purpose: "campaign-update";
        update: CampaignUpdateStorageData;
        formData?: undefined;
        avatar?: undefined;
        network?: SupportedNetwork;
        storageEpochs?: number;
      }
    | {
        purpose: "profile-avatar";
        avatar: File;
        formData?: undefined;
        update?: undefined;
        network?: SupportedNetwork;
        storageEpochs?: number;
      };

  const prepare = useMutation<WalrusFlowState, Error, PrepareArgs>({
    mutationFn: async ({
      purpose = "campaign",
      formData,
      update,
      avatar,
      network = DEFAULT_NETWORK,
      storageEpochs,
    }) => {
      const resolvedNetwork = network ?? DEFAULT_NETWORK;
      const networkKey: keyof typeof WALRUS_EPOCH_CONFIG = resolvedNetwork;
      const epochs =
        storageEpochs ?? WALRUS_EPOCH_CONFIG[networkKey].defaultEpochs;

      let files: WalrusFile[];
      let context: WalrusFlowContext | undefined;

      if (purpose === "campaign") {
        if (!formData) {
          throw new Error("Campaign form data is required for campaign uploads");
        }
        files = await prepareCampaignFiles(formData);
      } else {
        if (purpose === "campaign-update") {
          if (!update) {
            throw new Error("Update payload is required for campaign update uploads");
          }
          files = await prepareCampaignUpdateFiles(update);
        } else {
          if (!avatar) {
            throw new Error("Profile avatar file is required for uploads");
          }
          const preparation = await prepareProfileAvatarFile(avatar);
          files = preparation.files;
          context = {
            profileAvatarIdentifier: preparation.identifier,
            profileAvatarMimeType: preparation.mimeType,
          };
        }
      }

      const walrusClient = createWalrusClient(suiClient, resolvedNetwork);
      const flow = await createWalrusUploadFlow(walrusClient, files);

      return {
        flow,
        files,
        storageEpochs: epochs,
        network: resolvedNetwork,
        purpose,
        context,
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
