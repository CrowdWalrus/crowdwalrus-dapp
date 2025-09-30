/**
 * Walrus Storage Service
 *
 * This service handles all interactions with Walrus decentralized storage,
 * including file uploads, Quilt management, and cost calculations.
 */

import { WalrusClient, WalrusFile } from "@mysten/walrus";
import type { SuiClient } from "@mysten/sui/client";
import type { Signer } from "@mysten/sui/cryptography";
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
 * Upload campaign files to Walrus using Quilt
 */
export async function uploadCampaignFiles(
  walrusClient: WalrusClient,
  files: WalrusFile[],
  epochs: number,
  signer: Signer,
): Promise<WalrusUploadResult> {
  try {
    // Upload all files as a single Quilt
    const results = await walrusClient.writeFiles({
      files,
      epochs,
      deletable: false, // Campaign content should be permanent
      signer,
    });

    // writeFiles returns an array, get the first result
    const result = results[0];
    if (!result) {
      throw new Error("No result returned from Walrus upload");
    }

    // Calculate file sizes (we need to get them from the files)
    const fileSizes = await Promise.all(
      files.map(async (file) => ({
        identifier: (await file.getIdentifier()) || "unknown",
        size: (await file.bytes()).length,
      })),
    );

    const totalSize = fileSizes.reduce((sum, file) => sum + file.size, 0);
    const cost = estimateStorageCostSimple(totalSize, epochs);

    return {
      blobId: result.blobId,
      blobObject: result.blobObject.id.id,
      files: fileSizes,
      cost,
    };
  } catch (error) {
    throw new WalrusUploadError(
      `Failed to upload files to Walrus: ${error instanceof Error ? error.message : "Unknown error"}`,
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
