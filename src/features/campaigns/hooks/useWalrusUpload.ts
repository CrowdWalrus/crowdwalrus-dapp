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
import {
  useSuiClient,
  useSignAndExecuteTransaction,
  useCurrentAccount,
} from "@mysten/dapp-kit";
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
import {
  DEFAULT_NETWORK,
  WALRUS_EPOCH_CONFIG,
  WAL_COIN_TYPE,
} from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";
import {
  executeWithStaleObjectRetry,
  isInsufficientCoinBalanceError,
  isInsufficientSuiGasError,
  isStaleObjectError,
  isUserRejectedError,
} from "@/shared/utils/errors";

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

const WAL_COIN_SYNC_ATTEMPTS = 4;
const WAL_COIN_SYNC_DELAY_MS = 600;
const REGISTER_RETRY_DELAY_MS = 1000;
const REGISTER_MAX_RETRIES = 1; // Initial attempt + 1 retry
const REGISTER_STALE_SYNC_MESSAGE =
  "Your wallet just changed and coin objects are still syncing. Please wait a few seconds and try Register Storage again.";
const REGISTER_INSUFFICIENT_WAL_MESSAGE =
  "Insufficient WAL balance to register storage.";
const REGISTER_INSUFFICIENT_GAS_MESSAGE =
  "Insufficient SUI balance for gas fees. Leave some SUI in your wallet and try Register Storage again.";
const CERTIFY_STALE_SYNC_MESSAGE =
  "Wallet objects are still syncing. Please wait a few seconds and try Certify again.";
const CERTIFY_INSUFFICIENT_GAS_MESSAGE =
  "Insufficient SUI balance for gas fees. Leave some SUI in your wallet and try Certify again.";

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

async function waitForWalCoinSync(
  owner: string,
  network: SupportedNetwork,
  suiClient: ReturnType<typeof useSuiClient>,
) {
  const walCoinType = WAL_COIN_TYPE[network];

  try {
    const walBalance = await suiClient.getBalance({
      owner,
      coinType: walCoinType,
    });
    if (!walBalance.totalBalance || BigInt(walBalance.totalBalance) <= 0n) {
      return;
    }

    for (let attempt = 1; attempt <= WAL_COIN_SYNC_ATTEMPTS; attempt += 1) {
      const page = await suiClient.getCoins({
        owner,
        coinType: walCoinType,
        limit: 20,
      });
      const hasSpendableCoin = page.data.some(
        (coin) => BigInt(coin.balance ?? "0") > 0n,
      );

      if (hasSpendableCoin) {
        return;
      }

      if (attempt < WAL_COIN_SYNC_ATTEMPTS) {
        await wait(WAL_COIN_SYNC_DELAY_MS * attempt);
      }
    }
  } catch (error) {
    console.warn("[Walrus register] WAL coin preflight check failed:", error);
  }
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
      const resolvedNetwork = network;
      const networkKey: keyof typeof WALRUS_EPOCH_CONFIG = resolvedNetwork;
      const epochConfig = WALRUS_EPOCH_CONFIG[networkKey];
      const minEpochs = epochConfig.minEpochs ?? 1;
      const requestedEpochs =
        typeof storageEpochs === "number" && Number.isFinite(storageEpochs)
          ? storageEpochs
          : epochConfig.defaultEpochs;
      let epochs = Math.min(
        Math.max(requestedEpochs, minEpochs),
        epochConfig.maxEpochs,
      );

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
      try {
        const systemState = await walrusClient.systemState();
        const protocolMaxEpochs = Number(systemState.future_accounting.length);
        if (
          Number.isFinite(protocolMaxEpochs) &&
          protocolMaxEpochs > 0 &&
          epochs > protocolMaxEpochs
        ) {
          epochs = protocolMaxEpochs;
        }
      } catch (error) {
        console.warn(
          "[Walrus prepare] Failed to load protocol epoch cap, using app config cap.",
          error,
        );
      }

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

      const walCoinType = WAL_COIN_TYPE[flowState.network];

      try {
        return await executeWithStaleObjectRetry({
          maxRetries: REGISTER_MAX_RETRIES,
          retryDelayMs: REGISTER_RETRY_DELAY_MS,
          onRetry: (error, nextAttempt) => {
            console.warn(
              `[Walrus register] Attempt ${nextAttempt + 1} failed due to stale object references. Retrying...`,
              error,
            );
          },
          execute: async () => {
            await waitForWalCoinSync(
              currentAccount.address,
              flowState.network,
              suiClient,
            );

            const registerTx = buildRegisterTransaction(
              flowState.flow,
              flowState.storageEpochs,
              currentAccount.address,
            );

            // Resolve intents with our own Sui client before wallet signing.
            // This avoids wallet-side stale coin object selection after recent WAL changes.
            await registerTx.build({ client: suiClient });

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
          },
        });
      } catch (error) {
        if (isUserRejectedError(error)) {
          throw error;
        }

        if (isInsufficientSuiGasError(error)) {
          throw new Error(REGISTER_INSUFFICIENT_GAS_MESSAGE);
        }

        if (
          isInsufficientCoinBalanceError(error, {
            expectedCoinMarkers: [walCoinType, "::wal::wal"],
          })
        ) {
          throw new Error(REGISTER_INSUFFICIENT_WAL_MESSAGE);
        }

        if (isStaleObjectError(error)) {
          throw new Error(REGISTER_STALE_SYNC_MESSAGE);
        }

        throw error instanceof Error
          ? error
          : new Error("Failed to register Walrus storage.");
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
      try {
        const certifyTx = buildCertifyTransaction(flowState.flow);

        const result = await signAndExecute({
          transaction: certifyTx,
          chain: `sui:${flowState.network}`,
        });

        if (!result) {
          throw new Error("Failed to certify blob: No result returned");
        }

        const uploadResult = await getUploadedFilesInfo(
          suiClient,
          flowState.flow,
          flowState.files,
          flowState.storageEpochs,
          flowState.network,
        );

        return {
          blobId: uploadResult.blobId,
          cost: uploadResult.cost,
          storageEpochs: flowState.storageEpochs,
        };
      } catch (error) {
        if (isUserRejectedError(error)) {
          throw error;
        }
        if (isInsufficientSuiGasError(error)) {
          throw new Error(CERTIFY_INSUFFICIENT_GAS_MESSAGE);
        }
        if (isStaleObjectError(error)) {
          throw new Error(CERTIFY_STALE_SYNC_MESSAGE);
        }
        throw error instanceof Error
          ? error
          : new Error("Failed to certify Walrus storage.");
      }
    },
  });

  return {
    prepare,
    register,
    upload,
    certify,
  };
}
