/**
 * Campaign Creation Hook
 *
 * This hook orchestrates the complete campaign creation flow:
 * 1. Validate form data
 * 2. Prepare files for Walrus upload
 * 3. Upload to Walrus using multi-step flow (encode, register, upload, certify)
 *    - Register and certify steps require wallet signatures
 *    - This approach avoids browser popup blocking
 * 4. Build Sui transaction for campaign creation
 * 5. Execute campaign creation transaction
 * 6. Return campaign details
 *
 * Usage:
 * const { mutate: createCampaign, isPending, error, data } = useCreateCampaign();
 * createCampaign({ formData }, {
 *   onSuccess: (result) => console.log('Campaign created:', result),
 *   onError: (error) => console.error('Failed:', error),
 * });
 */

import { useMutation } from '@tanstack/react-query';
import { useSuiClient } from '@mysten/dapp-kit';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useCurrentAccount } from '@mysten/dapp-kit';
import {
  createWalrusClient,
  prepareCampaignFiles,
  createWalrusUploadFlow,
  buildRegisterTransaction,
  uploadToWalrusNodes,
  buildCertifyTransaction,
  getUploadedFilesInfo,
  getWalrusUrl,
} from '@/services/walrus';
import {
  buildCreateCampaignTransaction,
  validateCampaignFormData,
  extractCampaignIdFromEffects,
} from '@/services/campaign-transaction';
import { getContractConfig } from '@/config/contracts';
import {
  CampaignCreationStep,
  CampaignCreationError,
  TransactionExecutionError,
  type CampaignFormData,
  type CreateCampaignResult,
  type CampaignCreationProgress,
} from '@/types/campaign';
import { useState } from 'react';

/**
 * Options for the campaign creation mutation
 */
interface CreateCampaignOptions {
  network?: 'devnet' | 'testnet' | 'mainnet';
  onProgress?: (progress: CampaignCreationProgress) => void;
}

/**
 * Internal mutation variables
 */
interface CreateCampaignVariables {
  formData: CampaignFormData;
  options?: CreateCampaignOptions;
}

/**
 * Hook to create a new campaign
 */
export function useCreateCampaign() {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();

  const [currentStep, setCurrentStep] = useState<CampaignCreationStep>(
    CampaignCreationStep.IDLE
  );

  const mutation = useMutation<
    CreateCampaignResult,
    Error,
    CreateCampaignVariables
  >({
    mutationFn: async ({ formData, options }) => {
      // Ensure wallet is connected
      if (!currentAccount) {
        throw new CampaignCreationError(
          'Wallet not connected. Please connect your wallet to create a campaign.',
          CampaignCreationStep.IDLE
        );
      }

      const network = options?.network || 'testnet';
      const config = getContractConfig(network);
      const storageEpochs =
        formData.storage_epochs || config.storageDefaults.defaultEpochs;

      // Helper to report progress
      const reportProgress = (
        step: CampaignCreationStep,
        message: string,
        percentage?: number
      ) => {
        setCurrentStep(step);
        options?.onProgress?.({ step, message, percentage });
      };

      try {
        // Step 1: Validate form data
        reportProgress(
          CampaignCreationStep.VALIDATING,
          'Validating campaign data...',
          10
        );
        validateCampaignFormData(formData);

        // Step 2: Prepare files for Walrus
        reportProgress(
          CampaignCreationStep.PREPARING_FILES,
          'Preparing campaign files...',
          20
        );
        const files = await prepareCampaignFiles(formData);

        // Step 3: Upload to Walrus (multi-step process)
        const walrusClient = createWalrusClient(suiClient, network);

        // Step 3a: Encode files
        reportProgress(
          CampaignCreationStep.UPLOADING_TO_WALRUS,
          'Encoding files for Walrus upload...',
          40
        );

        const flow = await createWalrusUploadFlow(walrusClient, files);

        // Step 3b: Register blob (requires wallet signature)
        reportProgress(
          CampaignCreationStep.UPLOADING_TO_WALRUS,
          'Registering blob on blockchain (wallet signature required)...',
          50
        );

        const registerTx = buildRegisterTransaction(
          flow,
          storageEpochs,
          currentAccount.address
        );

        const registerResult = await signAndExecuteTransaction(
          {
            transaction: registerTx,
            chain: `sui:${network}`,
          },
          {
            onSuccess: (txResult) => {
              console.log('Register transaction successful:', txResult);
            },
          }
        );

        if (!registerResult) {
          throw new CampaignCreationError(
            'Failed to register blob: No result returned',
            CampaignCreationStep.UPLOADING_TO_WALRUS
          );
        }

        // Step 3c: Upload data to storage nodes
        reportProgress(
          CampaignCreationStep.UPLOADING_TO_WALRUS,
          'Uploading data to Walrus storage nodes...',
          60
        );

        await uploadToWalrusNodes(flow, registerResult.digest);

        // Step 3d: Certify blob (requires wallet signature)
        reportProgress(
          CampaignCreationStep.UPLOADING_TO_WALRUS,
          'Certifying blob (wallet signature required)...',
          65
        );

        const certifyTx = buildCertifyTransaction(flow);

        const certifyResult = await signAndExecuteTransaction(
          {
            transaction: certifyTx,
            chain: `sui:${network}`,
          },
          {
            onSuccess: (txResult) => {
              console.log('Certify transaction successful:', txResult);
            },
          }
        );

        if (!certifyResult) {
          throw new CampaignCreationError(
            'Failed to certify blob: No result returned',
            CampaignCreationStep.UPLOADING_TO_WALRUS
          );
        }

        // Step 3e: Get uploaded files info
        const uploadResult = await getUploadedFilesInfo(
          flow,
          files,
          storageEpochs
        );

        // Step 4: Build Sui transaction
        reportProgress(
          CampaignCreationStep.BUILDING_TRANSACTION,
          'Building blockchain transaction...',
          70
        );

        const transaction = buildCreateCampaignTransaction(
          formData,
          uploadResult.blobId,
          network
        );

        // Step 5: Execute transaction
        reportProgress(
          CampaignCreationStep.EXECUTING_TRANSACTION,
          'Executing transaction on Sui blockchain...',
          85
        );

        const result = await signAndExecuteTransaction(
          {
            transaction,
            chain: `sui:${network}`,
          },
          {
            onSuccess: (txResult) => {
              console.log('Transaction successful:', txResult);
            },
          }
        );

        if (!result) {
          throw new TransactionExecutionError(
            'Transaction failed: No result returned'
          );
        }

        // Extract campaign ID from transaction effects
        const campaignId = extractCampaignIdFromEffects(
          result.effects,
          config.contracts.packageId
        );

        if (!campaignId) {
          throw new TransactionExecutionError(
            'Failed to extract campaign ID from transaction effects'
          );
        }

        // Step 6: Complete
        reportProgress(
          CampaignCreationStep.COMPLETED,
          'Campaign created successfully!',
          100
        );

        // Build result with Walrus URLs for content retrieval
        const walrusDescriptionUrl = getWalrusUrl(
          uploadResult.blobId,
          network,
          'description.html'
        );
        const walrusCoverImageUrl = getWalrusUrl(
          uploadResult.blobId,
          network,
          'cover.jpg'
        );

        const finalResult: CreateCampaignResult = {
          campaignId,
          transactionDigest: result.digest,
          walrusBlobId: uploadResult.blobId,
          subdomain: formData.subdomain_name,
          walrusDescriptionUrl,
          walrusCoverImageUrl,
        };

        return finalResult;
      } catch (error) {
        setCurrentStep(CampaignCreationStep.FAILED);

        // Re-throw if already a CampaignCreationError
        if (error instanceof CampaignCreationError) {
          throw error;
        }

        // Wrap other errors
        throw new CampaignCreationError(
          error instanceof Error
            ? error.message
            : 'An unknown error occurred during campaign creation',
          currentStep,
          error
        );
      }
    },
  });

  return {
    ...mutation,
    currentStep,
  };
}

/**
 * Hook to get storage cost estimate
 * Useful for displaying cost before campaign creation
 */
export function useEstimateStorageCost() {
  return useMutation({
    mutationFn: async (formData: CampaignFormData) => {
      const { calculateStorageCost } = await import('@/services/walrus');
      return calculateStorageCost(formData);
    },
  });
}

/**
 * Helper hook to check if user has sufficient balance
 */
export function useCheckSufficientBalance() {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();

  return useMutation({
    mutationFn: async (requiredAmount: string) => {
      if (!currentAccount) {
        return { sufficient: false, balance: '0', required: requiredAmount };
      }

      try {
        const balance = await suiClient.getBalance({
          owner: currentAccount.address,
        });

        const balanceInSui = parseFloat(balance.totalBalance) / 1_000_000_000; // Convert MIST to SUI
        const required = parseFloat(requiredAmount);

        return {
          sufficient: balanceInSui >= required,
          balance: balanceInSui.toFixed(6),
          required: required.toFixed(6),
        };
      } catch (error) {
        console.error('Error checking balance:', error);
        return { sufficient: false, balance: '0', required: requiredAmount };
      }
    },
  });
}