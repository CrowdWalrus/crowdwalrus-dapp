/**
 * Walrus Storage Service
 *
 * This service handles all interactions with Walrus decentralized storage,
 * including file uploads, Quilt management, and cost calculations.
 */

import { WalrusClient, WalrusFile, type WriteFilesFlow } from "@mysten/walrus";
import type { SuiClient } from "@mysten/sui/client";
import {
  WalrusUploadError,
  type WalrusUploadResult,
  type StorageCostEstimate,
  type CampaignFormData,
} from "@/features/campaigns/types/campaign";
import type { CampaignUpdateStorageData } from "@/features/campaigns/types/campaignUpdate";
import { getContractConfig } from "@/shared/config/contracts";
import {
  PROFILE_AVATAR_STORAGE_DEFAULT_EPOCHS,
  WALRUS_EPOCH_CONFIG,
} from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";
import { formatTokenAmountFromNumber } from "@/shared/utils/currency";
import { lexicalToPlainText } from "@/shared/utils/lexical";
import {
  calculateCampaignStorageCost,
  type CampaignStorageCost,
} from "./walrus-pricing";
// Import WASM file with ?url suffix for Vite
import walrusWasmUrl from "@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url";

const SUPPORTED_AVATAR_MIME_TYPES = new Set(["image/jpeg", "image/png"]);

/**
 * Create and configure a WalrusClient instance
 */
export function createWalrusClient(
  suiClient: SuiClient,
  network: SupportedNetwork,
): WalrusClient {
  const config = getContractConfig(network);

  // WalrusClient only supports testnet and mainnet
  const walrusNetwork =
    network === "devnet" ? "testnet" : config.walrus.network;

  return new WalrusClient({
    suiClient,
    network: walrusNetwork as "testnet" | "mainnet",
    wasmUrl: walrusWasmUrl,
  });
}

/**
 * Prepare campaign files for Quilt upload
 * Stores Lexical editor state (JSON) and cover image - React app handles rendering
 */
export async function prepareCampaignFiles(
  formData: CampaignFormData,
): Promise<WalrusFile[]> {
  console.log("\n=== PREPARING WALRUS FILES ===");
  const files: WalrusFile[] = [];

  // 1. Store Lexical editor state as JSON
  const descriptionBytes = new TextEncoder().encode(formData.full_description);
  const descriptionFile = WalrusFile.from({
    contents: descriptionBytes,
    identifier: "description.json",
    tags: {
      "content-type": "application/json",
      "file-type": "description",
    },
  });
  files.push(descriptionFile);
  console.log("File 1: description.json -", descriptionBytes.length, "bytes");

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
  console.log("File 2: cover.jpg -", coverImageBuffer.byteLength, "bytes");
  console.log("Total files:", files.length);
  console.log("Total size:", descriptionBytes.length + coverImageBuffer.byteLength, "bytes");
  console.log("==============================\n");

  return files;
}

/**
 * Prepare campaign update files for Walrus upload.
 * Stores Lexical editor state (JSON) for an update entry.
 */
export async function prepareCampaignUpdateFiles(
  data: CampaignUpdateStorageData,
): Promise<WalrusFile[]> {
  const identifier = data.identifier?.trim() || "update.json";
  const serializedContent = data.serializedContent ?? "";

  const plainTextContent = lexicalToPlainText(serializedContent);
  if (
    !serializedContent ||
    serializedContent.trim().length === 0 ||
    plainTextContent.length === 0
  ) {
    throw new WalrusUploadError("Update content is empty. Please add content before uploading.");
  }

  const files: WalrusFile[] = [];
  const updateBytes = new TextEncoder().encode(serializedContent);
  const updateFile = WalrusFile.from({
    contents: updateBytes,
    identifier,
    tags: {
      "content-type": "application/json",
      "file-type": "campaign-update",
      ...(data.title ? { title: data.title } : {}),
    },
  });

  files.push(updateFile);

  return files;
}

interface ProfileAvatarPreparationResult {
  files: WalrusFile[];
  identifier: string;
  mimeType: string;
  size: number;
}

/**
 * Prepare a profile avatar image for Walrus upload.
 */
export async function prepareProfileAvatarFile(
  file: File,
): Promise<ProfileAvatarPreparationResult> {
  if (!(file instanceof File)) {
    throw new WalrusUploadError("A valid profile image file is required.");
  }

  if (!SUPPORTED_AVATAR_MIME_TYPES.has(file.type)) {
    throw new WalrusUploadError(
      `Unsupported image format: ${file.type || "unknown"}. Please upload a JPEG or PNG image.`,
    );
  }

  const normalizedType = file.type as "image/jpeg" | "image/png";

  const buffer = await file.arrayBuffer();
  const extension = normalizedType === "image/png" ? "png" : "jpg";
  const identifier = `avatar.${extension}`;

  const walrusFile = WalrusFile.from({
    contents: new Uint8Array(buffer),
    identifier,
    tags: {
      "content-type": normalizedType,
      "file-type": "profile-avatar",
    },
  });

  return {
    files: [walrusFile],
    identifier,
    mimeType: normalizedType,
    size: buffer.byteLength,
  };
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
): Promise<WriteFilesFlow> {
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
  flow: WriteFilesFlow,
  epochs: number,
  owner: string,
) {
  try {
    // Note: getStorageCost is not available on WriteFilesFlow type
    // Cost calculation happens separately via calculateStorageCost
    const costInfo = null;

    console.log("\n=== WALRUS REGISTER TRANSACTION ===");
    console.log("Epochs:", epochs);
    console.log("Owner:", owner);
    console.log("Deletable:", false);
    if (costInfo) {
      console.log("Storage Cost Info:", costInfo);
    }
    console.log("===================================\n");

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
  flow: WriteFilesFlow,
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
export function buildCertifyTransaction(flow: WriteFilesFlow) {
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
  suiClient: SuiClient,
  flow: WriteFilesFlow,
  files: WalrusFile[],
  epochs: number,
  network: SupportedNetwork,
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

    console.log("\n=== WALRUS UPLOAD COMPLETE ===");
    console.log("Blob ID:", blobId);
    console.log("Blob Object:", blobObject);

    // Calculate file sizes
    const fileSizes = await Promise.all(
      files.map(async (file) => ({
        identifier: (await file.getIdentifier()) || "unknown",
        size: (await file.bytes()).length,
      })),
    );

    console.log("Files uploaded:");
    fileSizes.forEach(f => console.log(`  - ${f.identifier}: ${f.size} bytes`));

    const totalSize = fileSizes.reduce((sum, file) => sum + file.size, 0);
    let cost = "N/A";

    try {
      const pricingNetwork = network === "devnet" ? "testnet" : network;
      const costBreakdown = await calculateCampaignStorageCost(
        suiClient,
        pricingNetwork,
        totalSize,
        epochs,
      );
      cost = formatTokenAmountFromNumber(costBreakdown.subsidizedTotalCost);
    } catch (costError) {
      console.warn("Failed to estimate upload cost after certification:", costError);
    }

    console.log("Total size:", totalSize, "bytes");
    console.log("Storage epochs:", epochs);
    if (cost === "N/A") {
      console.log("Estimated cost: N/A (already paid during registration)");
    } else {
      console.log("Estimated cost:", cost, "WAL");
    }
    console.log("==============================\n");

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
 * Calculate estimated storage cost for campaign files using real Walrus pricing
 */
export async function calculateStorageCost(
  suiClient: SuiClient,
  network: SupportedNetwork,
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
    fileSizes.find((f) => f.identifier === "description.json")?.bytes.length ||
    0;
  const imagesSize =
    fileSizes.find((f) => f.identifier === "cover.jpg")?.bytes.length || 0;
  const rawSize = descriptionSize + imagesSize;

  const networkKey = network === "devnet" ? "devnet" : network;
  const epochConfig = WALRUS_EPOCH_CONFIG[networkKey];
  const minEpochs = epochConfig.minEpochs ?? 1;
  const requestedEpochs =
    typeof epochs === "number" && Number.isFinite(epochs)
      ? epochs
      : epochConfig.defaultEpochs;
  const storageEpochs = Math.min(
    Math.max(requestedEpochs, minEpochs),
    epochConfig.maxEpochs,
  );

  // Query real Walrus pricing and calculate accurate costs
  const cost: CampaignStorageCost = await calculateCampaignStorageCost(
    suiClient,
    network === "devnet" ? "testnet" : network,
    rawSize,
    storageEpochs,
  );

  return {
    rawSize,
    encodedSize: cost.encodedSize,
    metadataSize: cost.metadataSize,
    epochs: storageEpochs,
    storageCostWal: cost.storageCostWal,
    uploadCostWal: cost.uploadCostWal,
    totalCostWal: cost.totalCostWal,
    subsidizedStorageCost: cost.subsidizedStorageCost,
    subsidizedUploadCost: cost.subsidizedUploadCost,
    subsidizedTotalCost: cost.subsidizedTotalCost,
    subsidyRate: cost.pricing.subsidyRate,
    estimatedCost: formatTokenAmountFromNumber(cost.subsidizedTotalCost), // Legacy field (now shows subsidized cost)
    breakdown: {
      jsonSize: descriptionSize,
      imagesSize,
    },
    pricingTimestamp: cost.pricing.timestamp,
    network: cost.pricing.network,
  };
}

/**
 * Calculate estimated storage cost for campaign update content.
 */
export async function calculateUpdateStorageCost(
  suiClient: SuiClient,
  network: SupportedNetwork,
  data: CampaignUpdateStorageData,
  epochs?: number,
): Promise<StorageCostEstimate> {
  const files = await prepareCampaignUpdateFiles(data);

  const fileSizesPromises = files.map(async (file) => ({
    identifier: (await file.getIdentifier()) || "update.json",
    bytes: await file.bytes(),
  }));

  const fileSizes = await Promise.all(fileSizesPromises);

  const updateSize = fileSizes.reduce((total, current) => {
    return total + current.bytes.length;
  }, 0);

  const networkKey = network === "devnet" ? "devnet" : network;
  const epochConfig = WALRUS_EPOCH_CONFIG[networkKey];
  const minEpochs = epochConfig.minEpochs ?? 1;
  const requestedEpochs =
    typeof epochs === "number" && Number.isFinite(epochs)
      ? epochs
      : epochConfig.defaultEpochs;
  const storageEpochs = Math.min(
    Math.max(requestedEpochs, minEpochs),
    epochConfig.maxEpochs,
  );

  const cost: CampaignStorageCost = await calculateCampaignStorageCost(
    suiClient,
    network === "devnet" ? "testnet" : network,
    updateSize,
    storageEpochs,
  );

  return {
    rawSize: updateSize,
    encodedSize: cost.encodedSize,
    metadataSize: cost.metadataSize,
    epochs: storageEpochs,
    storageCostWal: cost.storageCostWal,
    uploadCostWal: cost.uploadCostWal,
    totalCostWal: cost.totalCostWal,
    subsidizedStorageCost: cost.subsidizedStorageCost,
    subsidizedUploadCost: cost.subsidizedUploadCost,
    subsidizedTotalCost: cost.subsidizedTotalCost,
    subsidyRate: cost.pricing.subsidyRate,
    estimatedCost: formatTokenAmountFromNumber(cost.subsidizedTotalCost),
    breakdown: {
      jsonSize: updateSize,
      imagesSize: 0,
    },
    pricingTimestamp: cost.pricing.timestamp,
    network: cost.pricing.network,
  };
}

/**
 * Calculate storage cost for a profile avatar image upload.
 */
export async function calculateProfileAvatarStorageCost(
  suiClient: SuiClient,
  network: SupportedNetwork,
  file: File,
  epochs?: number,
): Promise<StorageCostEstimate> {
  const preparation = await prepareProfileAvatarFile(file);

  const resolvedNetwork = network === "devnet" ? "devnet" : network;
  const minimumEpochs = PROFILE_AVATAR_STORAGE_DEFAULT_EPOCHS[resolvedNetwork];
  const requestedEpochs =
    typeof epochs === "number" && Number.isFinite(epochs)
      ? epochs
      : minimumEpochs;
  const storageEpochs = Math.max(minimumEpochs, requestedEpochs);

  const cost: CampaignStorageCost = await calculateCampaignStorageCost(
    suiClient,
    network === "devnet" ? "testnet" : network,
    preparation.size,
    storageEpochs,
  );

  return {
    rawSize: preparation.size,
    encodedSize: cost.encodedSize,
    metadataSize: cost.metadataSize,
    epochs: storageEpochs,
    storageCostWal: cost.storageCostWal,
    uploadCostWal: cost.uploadCostWal,
    totalCostWal: cost.totalCostWal,
    subsidizedStorageCost: cost.subsidizedStorageCost,
    subsidizedUploadCost: cost.subsidizedUploadCost,
    subsidizedTotalCost: cost.subsidizedTotalCost,
    subsidyRate: cost.pricing.subsidyRate,
    estimatedCost: formatTokenAmountFromNumber(cost.subsidizedTotalCost),
    breakdown: {
      jsonSize: 0,
      imagesSize: preparation.size,
    },
    pricingTimestamp: cost.pricing.timestamp,
    network: cost.pricing.network,
  };
}

/**
 * Get the URL to access a file from Walrus Quilt
 * Uses the Quilt API endpoint to access individual files by identifier
 */
export function getWalrusUrl(
  blobId: string,
  network: SupportedNetwork,
  fileName: string,
): string {
  const config = getContractConfig(network);
  const baseUrl = config.walrus.aggregatorUrl;
  return `${baseUrl}/blobs/by-quilt-id/${blobId}/${fileName}`;
}
