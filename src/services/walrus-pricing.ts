/**
 * Walrus Pricing Service
 *
 * Queries Walrus system object on Sui for real-time storage and upload pricing.
 * Implements caching to minimize RPC calls.
 */

import type { SuiClient } from "@mysten/sui/client";
import { getContractConfig } from "@/shared/config/contracts";

/**
 * Pricing information from Walrus system
 * All prices in FROST (1 WAL = 1,000,000,000 FROST)
 */
export interface WalrusPricing {
  storagePerMbPerEpoch: number; // FROST per MB per epoch
  uploadPerMb: number; // FROST per MB (one-time)
  timestamp: number; // When this pricing was fetched
  network: 'testnet' | 'mainnet';
}

/**
 * Fallback pricing constants (Mainnet as of March 2025)
 * Used when system object query fails
 */
const FALLBACK_PRICING: WalrusPricing = {
  storagePerMbPerEpoch: 100_000, // 100,000 FROST per MB per epoch
  uploadPerMb: 20_000, // 20,000 FROST per MB
  timestamp: Date.now(),
  network: 'mainnet',
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
 * Query Walrus system object for current pricing
 */
async function querySystemPricing(
  suiClient: SuiClient,
  network: 'testnet' | 'mainnet',
): Promise<WalrusPricing> {
  // Get system object ID from centralized config
  const config = getContractConfig(network);
  const systemObjectId = config.walrus.systemObjectId;

  try {
    // Query the Walrus system object
    const systemObject = await suiClient.getObject({
      id: systemObjectId,
      options: {
        showContent: true,
      },
    });

    if (!systemObject.data?.content || systemObject.data.content.dataType !== 'moveObject') {
      throw new Error('Invalid system object structure');
    }

    const fields = systemObject.data.content.fields as any;

    // Extract pricing from system object fields
    // The exact field names may vary - adjust based on actual Walrus Move struct
    const storagePerMbPerEpoch = fields.storage_price_per_kib
      ? Math.round(Number(fields.storage_price_per_kib) * 1024)
      : FALLBACK_PRICING.storagePerMbPerEpoch;

    const uploadPerMb = fields.write_price_per_kib
      ? Math.round(Number(fields.write_price_per_kib) * 1024)
      : FALLBACK_PRICING.uploadPerMb;

    return {
      storagePerMbPerEpoch,
      uploadPerMb,
      timestamp: Date.now(),
      network,
    };
  } catch (error) {
    console.warn(`Failed to query Walrus system object for ${network}:`, error);
    console.warn('Using fallback pricing estimates');
    return {
      ...FALLBACK_PRICING,
      network,
    };
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

  // Costs in WAL
  storageCostWal: number; // Storage cost (per epoch)
  uploadCostWal: number;  // One-time upload cost
  totalCostWal: number;   // Total cost

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

  return {
    rawSize: rawSizeBytes,
    encodedSize,
    metadataSize: METADATA_SIZE_BYTES,
    storageCostWal,
    uploadCostWal,
    totalCostWal,
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