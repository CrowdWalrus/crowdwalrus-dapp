/**
 * Walrus Storage Service
 *
 * This service handles all interactions with Walrus decentralized storage,
 * including file uploads, Quilt management, and cost calculations.
 */

import { WalrusClient, WalrusFile } from "@mysten/walrus";
import type { SuiClient } from "@mysten/sui/client";
import {
  WalrusUploadError,
  type WalrusUploadResult,
  type StorageCostEstimate,
  type CampaignFormData,
} from "@/types/campaign";
import { getContractConfig, STORAGE_COST_MULTIPLIER } from "@/config/contracts";

/**
 * Create and configure a WalrusClient instance
 */
export function createWalrusClient(
  suiClient: SuiClient,
  network: "devnet" | "testnet" | "mainnet",
): WalrusClient {
  const config = getContractConfig(network);

  // WalrusClient only supports testnet and mainnet
  const walrusNetwork =
    network === "devnet" ? "testnet" : config.walrus.network;

  return new WalrusClient({
    suiClient,
    network: walrusNetwork as "testnet" | "mainnet",
  });
}

/**
 * Prepare campaign files for Quilt upload
 * Stores raw rich text HTML and cover image - React app handles rendering
 */
export async function prepareCampaignFiles(
  formData: CampaignFormData,
): Promise<WalrusFile[]> {
  const files: WalrusFile[] = [];

  // 1. Store raw rich text HTML from editor
  const descriptionBytes = new TextEncoder().encode(formData.full_description);
  const descriptionFile = WalrusFile.from({
    contents: descriptionBytes,
    identifier: "description.html",
    tags: {
      "content-type": "text/html",
      "file-type": "description",
    },
  });
  files.push(descriptionFile);

  // 2. Store cover image
  const coverImageBuffer = await formData.cover_image.arrayBuffer();
  const coverImageFile = WalrusFile.from({
    contents: new Uint8Array(coverImageBuffer),
    identifier: "cover.jpg",
    tags: {
      "content-type": formData.cover_image.type,
      "file-type": "cover",
    },
  });
  files.push(coverImageFile);

  return files;
}

/**
 * Create a Walrus upload flow for browser-based wallet signing
 * This approach avoids browser popup blocking by separating transaction signatures
 *
 * Returns the flow object that can be used for subsequent operations
 */
export async function createWalrusUploadFlow(
  walrusClient: WalrusClient,
  files: WalrusFile[],
) {
  try {
    // Create the upload flow
    const flow = walrusClient.writeFilesFlow({ files });

    // Encode the files (prepares them for upload)
    await flow.encode();

    return flow;
  } catch (error) {
    throw new WalrusUploadError(
      `Failed to create Walrus upload flow: ${error instanceof Error ? error.message : "Unknown error"}`,
      error,
    );
  }
}

/**
 * Build the register transaction for the Walrus upload flow
 * This transaction must be signed by the user's wallet
 */
export function buildRegisterTransaction(
  flow: any, // WriteFilesFlow type from SDK
  epochs: number,
  owner: string,
) {
  try {
    return flow.register({
      epochs,
      owner,
      deletable: false, // Campaign content should be permanent
    });
  } catch (error) {
    throw new WalrusUploadError(
      `Failed to build register transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
      error,
    );
  }
}

/**
 * Upload the actual file data to Walrus storage nodes
 * This happens after the register transaction is confirmed
 */
export async function uploadToWalrusNodes(
  flow: any, // WriteFilesFlow type from SDK
  registerDigest: string,
) {
  try {
    await flow.upload({ digest: registerDigest });
  } catch (error) {
    throw new WalrusUploadError(
      `Failed to upload to Walrus storage nodes: ${error instanceof Error ? error.message : "Unknown error"}`,
      error,
    );
  }
}

/**
 * Build the certify transaction for the Walrus upload flow
 * This transaction must be signed by the user's wallet to finalize the upload
 */
export function buildCertifyTransaction(flow: any) {
  try {
    return flow.certify();
  } catch (error) {
    throw new WalrusUploadError(
      `Failed to build certify transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
      error,
    );
  }
}

/**
 * Get the uploaded files information after certification
 * Returns blob ID and file details needed for campaign creation
 */
export async function getUploadedFilesInfo(
  flow: any,
  files: WalrusFile[],
  epochs: number,
): Promise<WalrusUploadResult> {
  try {
    // Get the list of uploaded files from the flow
    const uploadedFiles = await flow.listFiles();

    if (!uploadedFiles || uploadedFiles.length === 0) {
      throw new Error("No files returned from Walrus upload");
    }

    // Get the blob ID from the first file (they're all in the same Quilt)
    const blobId = uploadedFiles[0].blobId;
    const blobObject = uploadedFiles[0].blobObject?.id?.id || '';

    // Calculate file sizes
    const fileSizes = await Promise.all(
      files.map(async (file) => ({
        identifier: (await file.getIdentifier()) || "unknown",
        size: (await file.bytes()).length,
      })),
    );

    const totalSize = fileSizes.reduce((sum, file) => sum + file.size, 0);
    const cost = estimateStorageCostSimple(totalSize, epochs);

    return {
      blobId,
      blobObject,
      files: fileSizes,
      cost,
    };
  } catch (error) {
    throw new WalrusUploadError(
      `Failed to get uploaded files info: ${error instanceof Error ? error.message : "Unknown error"}`,
      error,
    );
  }
}

/**
 * Calculate estimated storage cost for campaign files
 */
export async function calculateStorageCost(
  formData: CampaignFormData,
  epochs?: number,
): Promise<StorageCostEstimate> {
  const files = await prepareCampaignFiles(formData);

  // Calculate sizes by getting bytes from each file
  const fileSizesPromises = files.map(async (file) => ({
    identifier: (await file.getIdentifier()) || "unknown",
    bytes: await file.bytes(),
  }));

  const fileSizes = await Promise.all(fileSizesPromises);

  const descriptionSize =
    fileSizes.find((f) => f.identifier === "description.html")?.bytes.length ||
    0;
  const imagesSize =
    fileSizes.find((f) => f.identifier === "cover.jpg")?.bytes.length || 0;
  const totalSize = descriptionSize + imagesSize;

  const storageEpochs =
    epochs || getContractConfig("testnet").storageDefaults.defaultEpochs;
  const estimatedCost = estimateStorageCostSimple(totalSize, storageEpochs);

  return {
    totalSize,
    epochs: storageEpochs,
    estimatedCost,
    breakdown: {
      htmlSize: descriptionSize,
      imagesSize,
    },
  };
}

/**
 * Simple storage cost estimation
 * Note: This is a rough estimate. Actual cost depends on Walrus pricing at the time.
 */
function estimateStorageCostSimple(blobSize: number, epochs: number): string {
  // Cost formula: blob_size * STORAGE_COST_MULTIPLIER * price_per_byte * epochs
  // For now, we'll use a placeholder price since Walrus pricing may vary
  // TODO: Update with actual Walrus pricing when available
  const PRICE_PER_BYTE_SUI = 0.000001; // Placeholder - update with actual pricing

  const cost = blobSize * STORAGE_COST_MULTIPLIER * PRICE_PER_BYTE_SUI * epochs;
  return cost.toFixed(6);
}

/**
 * Get the URL to access a file from Walrus Quilt
 * Uses the Quilt API endpoint to access individual files by identifier
 */
export function getWalrusUrl(
  blobId: string,
  network: "devnet" | "testnet" | "mainnet",
  fileName: string,
): string {
  const config = getContractConfig(network);
  const baseUrl = config.walrus.aggregatorUrl;
  return `${baseUrl}/blobs/by-quilt-id/${blobId}/${fileName}`;
}
