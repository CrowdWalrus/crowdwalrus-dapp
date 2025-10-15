/**
 * Walrus Pricing Service
 *
 * Queries Walrus system object on Sui for real-time storage and upload pricing.
 * Implements caching to minimize RPC calls.
 */

import type { SuiClient } from "@mysten/sui/client";
import { getContractConfig } from "@/shared/config/contracts";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getMoveObjectFields = (
  content: unknown,
): Record<string, unknown> | null => {
  if (
    isRecord(content) &&
    content.dataType === "moveObject" &&
    isRecord(content.fields)
  ) {
    return content.fields;
  }
  return null;
};

const getRecordField = (
  record: Record<string, unknown>,
  key: string,
): Record<string, unknown> | null => {
  const value = record[key];
  return isRecord(value) ? value : null;
};

const getNumericField = (
  record: Record<string, unknown>,
  key: string,
): number | undefined => {
  const value = record[key];
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "bigint") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

/**
 * Pricing information from Walrus system
 * All prices in FROST (1 WAL = 1,000,000,000 FROST)
 */
export interface WalrusPricing {
  storagePerMbPerEpoch: number; // FROST per MB per epoch
  uploadPerMb: number; // FROST per MB (one-time)
  timestamp: number; // When this pricing was fetched
  network: 'testnet' | 'mainnet';
  subsidyRate?: number; // Subsidy rate (0-1, e.g., 0.80 for 80% discount)
}

/**
 * Fallback pricing constants
 * Used when system object query fails
 * Note: Testnet and Mainnet have different pricing
 */
const FALLBACK_PRICING_MAINNET: WalrusPricing = {
  storagePerMbPerEpoch: 100_000, // 100,000 FROST per MB per epoch
  uploadPerMb: 20_000, // 20,000 FROST per MB
  timestamp: Date.now(),
  network: 'mainnet',
  subsidyRate: 0, // Mainnet currently has 0% subsidy (as of Jan 2025)
};

const FALLBACK_PRICING_TESTNET: WalrusPricing = {
  storagePerMbPerEpoch: 102_400, // 102,400 FROST per MB per epoch (100 per KiB)
  uploadPerMb: 2_048_000, // 2,048,000 FROST per MB (2000 per KiB)
  timestamp: Date.now(),
  network: 'testnet',
  // Testnet has implicit ~80% subsidy (pricing is arbitrary for testing)
  // Subsidy object doesn't exist on testnet but costs are effectively subsidized
  subsidyRate: 0.80,
};

/**
 * Pricing cache with 5-minute TTL
 */
interface PricingCache {
  pricing: WalrusPricing | null;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const pricingCache: Record<string, PricingCache> = {};

/**
 * Query Walrus subsidy object for discount rate
 */
async function querySubsidyRate(
  suiClient: SuiClient,
  network: 'testnet' | 'mainnet',
): Promise<number> {
  const config = getContractConfig(network);
  const subsidyObjectId = config.walrus.subsidyObjectId;
  const fallback = network === 'testnet' ? FALLBACK_PRICING_TESTNET : FALLBACK_PRICING_MAINNET;

  // Testnet doesn't have a subsidy object - use fallback (implicit subsidy)
  if (!subsidyObjectId || subsidyObjectId === '') {
    return fallback.subsidyRate || 0;
  }

  try {
    const subsidyObject = await suiClient.getObject({
      id: subsidyObjectId,
      options: {
        showContent: true,
      },
    });

    const fieldsRecord = getMoveObjectFields(subsidyObject.data?.content);
    if (!fieldsRecord) {
      throw new Error('Invalid subsidy object structure');
    }

    // Try buyer_subsidy_rate first, fall back to system_subsidy_rate
    const buyerRate = getNumericField(fieldsRecord, 'buyer_subsidy_rate');
    const systemRate = getNumericField(fieldsRecord, 'system_subsidy_rate');
    const subsidyRateBasisPoints = buyerRate ?? systemRate ?? 0;

    // Convert from basis points (if > 1) or use directly (if 0-1)
    // Basis points: 8000 = 80%, but if already decimal: 0.8 = 80%
    const subsidyRate = subsidyRateBasisPoints > 1
      ? subsidyRateBasisPoints / 10000
      : subsidyRateBasisPoints;

    return subsidyRate;
  } catch (error) {
    console.warn(`Failed to query subsidy rate for ${network}:`, error);
    return fallback.subsidyRate || 0;
  }
}

/**
 * Query Walrus system object for current pricing
 */
async function querySystemPricing(
  suiClient: SuiClient,
  network: 'testnet' | 'mainnet',
): Promise<WalrusPricing> {
  // Get system object ID from centralized config
  const config = getContractConfig(network);
  const systemObjectId = config.walrus.systemObjectId;
  const fallback = network === 'testnet' ? FALLBACK_PRICING_TESTNET : FALLBACK_PRICING_MAINNET;

  try {
    // The pricing is stored in a dynamic field called SystemStateInnerV1
    // First get the dynamic fields of the system object
    const dynamicFields = await suiClient.getDynamicFields({
      parentId: systemObjectId,
    });

    if (!dynamicFields.data || dynamicFields.data.length === 0) {
      throw new Error('No dynamic fields found in system object');
    }

    // Get the SystemStateInnerV1 dynamic field (usually the first one)
    const systemStateField = dynamicFields.data.find(f =>
      f.objectType?.includes('system_state_inner::SystemStateInnerV1')
    );

    if (!systemStateField) {
      throw new Error('SystemStateInnerV1 field not found');
    }

    // Get the actual field object with pricing data
    const fieldObject = await suiClient.getDynamicFieldObject({
      parentId: systemObjectId,
      name: systemStateField.name,
    });

    const contentFields = getMoveObjectFields(fieldObject.data?.content);
    if (!contentFields) {
      throw new Error('Invalid system state inner structure');
    }

    const valueRecord = getRecordField(contentFields, 'value');
    if (!valueRecord) {
      throw new Error('System state inner value not found');
    }

    const innerFields = getRecordField(valueRecord, 'fields');

    if (!innerFields) {
      throw new Error('System state inner fields not found');
    }

    // Extract pricing from system state inner fields
    // Pricing is per KiB (unit size), we convert to per MB
    const storagePerUnitSize =
      getNumericField(innerFields, 'storage_price_per_unit_size') ??
      fallback.storagePerMbPerEpoch / 1024;

    const writePerUnitSize =
      getNumericField(innerFields, 'write_price_per_unit_size') ??
      fallback.uploadPerMb / 1024;

    // Convert from per-KiB to per-MB (multiply by 1024)
    const storagePerMbPerEpoch = Math.round(storagePerUnitSize * 1024);
    const uploadPerMb = Math.round(writePerUnitSize * 1024);

    // Query subsidy rate
    const subsidyRate = await querySubsidyRate(suiClient, network);

    return {
      storagePerMbPerEpoch,
      uploadPerMb,
      timestamp: Date.now(),
      network,
      subsidyRate,
    };
  } catch (error) {
    console.warn(`Failed to query Walrus system object for ${network}:`, error);
    console.warn('Using fallback pricing estimates');
    return fallback;
  }
}

/**
 * Get current Walrus pricing with caching
 *
 * @param suiClient - Sui client instance
 * @param network - Network to query (testnet or mainnet)
 * @returns Current pricing information
 */
export async function getWalrusPricing(
  suiClient: SuiClient,
  network: 'testnet' | 'mainnet',
): Promise<WalrusPricing> {
  const cacheKey = network;
  const cached = pricingCache[cacheKey];

  // Return cached pricing if still valid
  if (cached && cached.expiresAt > Date.now() && cached.pricing) {
    return cached.pricing;
  }

  // Query fresh pricing
  const pricing = await querySystemPricing(suiClient, network);

  // Update cache
  pricingCache[cacheKey] = {
    pricing,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };

  return pricing;
}

/**
 * Convert FROST to WAL
 * 1 WAL = 1,000,000,000 FROST
 */
export function frostToWal(frost: number): number {
  return frost / 1_000_000_000;
}

/**
 * Convert WAL to FROST
 */
export function walToFrost(wal: number): number {
  return wal * 1_000_000_000;
}

/**
 * Convert bytes to MB
 */
export function bytesToMb(bytes: number): number {
  return bytes / (1024 * 1024);
}

/**
 * Calculate storage cost in WAL
 *
 * @param sizeBytes - Raw blob size in bytes
 * @param epochs - Number of epochs to store
 * @param pricing - Current Walrus pricing
 * @returns Storage cost in WAL
 */
export function calculateStorageCost(
  sizeBytes: number,
  epochs: number,
  pricing: WalrusPricing,
): number {
  const sizeMb = bytesToMb(sizeBytes);
  const costFrost = sizeMb * pricing.storagePerMbPerEpoch * epochs;
  return frostToWal(costFrost);
}

/**
 * Calculate upload cost in WAL
 *
 * @param sizeBytes - Raw blob size in bytes
 * @param pricing - Current Walrus pricing
 * @returns Upload cost in WAL
 */
export function calculateUploadCost(
  sizeBytes: number,
  pricing: WalrusPricing,
): number {
  const sizeMb = bytesToMb(sizeBytes);
  const costFrost = sizeMb * pricing.uploadPerMb;
  return frostToWal(costFrost);
}

/**
 * Calculate total encoded size (content + metadata)
 *
 * Walrus encoding:
 * - Content: 5x original size (erasure coding)
 * - Metadata: Fixed 64MB per blob
 */
export function calculateEncodedSize(rawSizeBytes: number): number {
  const ENCODING_MULTIPLIER = 5;
  const METADATA_SIZE_BYTES = 64 * 1024 * 1024; // 64MB

  return (rawSizeBytes * ENCODING_MULTIPLIER) + METADATA_SIZE_BYTES;
}

/**
 * Calculate total storage cost for campaign files
 * Includes both storage and upload costs
 */
export interface CampaignStorageCost {
  // Sizes
  rawSize: number;        // Original file sizes in bytes
  encodedSize: number;    // Size after encoding (5x + metadata)
  metadataSize: number;   // Fixed metadata overhead

  // Costs in WAL (before subsidy)
  storageCostWal: number; // Storage cost (per epoch)
  uploadCostWal: number;  // One-time upload cost
  totalCostWal: number;   // Total cost before subsidy

  // Subsidized costs
  subsidizedStorageCost: number; // Storage cost after subsidy
  subsidizedUploadCost: number;  // Upload cost after subsidy
  subsidizedTotalCost: number;   // Total cost after subsidy (what user actually pays)

  // Epochs
  epochs: number;

  // Pricing used
  pricing: WalrusPricing;
}

export async function calculateCampaignStorageCost(
  suiClient: SuiClient,
  network: 'testnet' | 'mainnet',
  rawSizeBytes: number,
  epochs: number,
): Promise<CampaignStorageCost> {
  const pricing = await getWalrusPricing(suiClient, network);

  const METADATA_SIZE_BYTES = 64 * 1024 * 1024; // 64MB
  const encodedSize = calculateEncodedSize(rawSizeBytes);

  const storageCostWal = calculateStorageCost(encodedSize, epochs, pricing);
  const uploadCostWal = calculateUploadCost(encodedSize, pricing);
  const totalCostWal = storageCostWal + uploadCostWal;

  // Apply subsidy rate
  const subsidyRate = pricing.subsidyRate || 0;
  const subsidyMultiplier = 1 - subsidyRate; // e.g., 0.80 subsidy means user pays 0.20

  const subsidizedStorageCost = storageCostWal * subsidyMultiplier;
  const subsidizedUploadCost = uploadCostWal * subsidyMultiplier;
  const subsidizedTotalCost = totalCostWal * subsidyMultiplier;

  return {
    rawSize: rawSizeBytes,
    encodedSize,
    metadataSize: METADATA_SIZE_BYTES,
    storageCostWal,
    uploadCostWal,
    totalCostWal,
    subsidizedStorageCost,
    subsidizedUploadCost,
    subsidizedTotalCost,
    epochs,
    pricing,
  };
}

/**
 * Clear pricing cache (useful for testing)
 */
export function clearPricingCache(): void {
  Object.keys(pricingCache).forEach(key => delete pricingCache[key]);
}
