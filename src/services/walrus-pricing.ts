/**
 * Walrus Pricing Service
 *
 * Uses Walrus protocol-consistent pricing:
 * - Encoded size from RedStuff/RS2 encoding formula
 * - Billing per storage unit (1 MiB), rounded up
 * - Storage and write prices from live Walrus system state
 */

import { WalrusClient } from "@mysten/walrus";
import type { SuiClient } from "@mysten/sui/client";
import { getContractConfig } from "@/shared/config/contracts";
import walrusWasmUrl from "@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url";

const STORAGE_UNIT_BYTES = 1024 * 1024; // 1 MiB
const FROST_PER_WAL = 1_000_000_000;
const DEFAULT_N_SHARDS = 1000;

// RedStuff/RS2 encoding constants
const DIGEST_LEN_BYTES = 32n;
const BLOB_ID_LEN_BYTES = 32n;
const RS2_SYMBOL_ALIGNMENT = 2n;

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

const getNumericField = (
  record: Record<string, unknown>,
  key: string,
): number | undefined => {
  const value = record[key];
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
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

const toNonNegativeInteger = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
};

const toPositiveInteger = (value: number, fallback = 1): number => {
  if (!Number.isFinite(value)) return fallback;
  const normalized = Math.floor(value);
  return normalized > 0 ? normalized : fallback;
};

const clampSubsidyRate = (value: number): number => {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.max(0, Math.min(value, 1));
};

const normalizeOnChainSubsidyRate = (value: number): number => {
  if (!Number.isFinite(value) || value < 0) return 0;
  // Walrus subsidy rates are encoded in basis points on-chain (u32).
  // If callers pass decimals (e.g. 0.8), preserve that behavior.
  if (Number.isInteger(value)) {
    return clampSubsidyRate(value / 10_000);
  }

  const normalized = value > 1 ? value / 10_000 : value;
  return clampSubsidyRate(normalized);
};

const getMaxFaultyNodes = (nShards: number): number =>
  Math.floor((nShards - 1) / 3);

const calculateMetadataSizeBytesBigInt = (nShards: number): bigint => {
  const shardCount = BigInt(toPositiveInteger(nShards, DEFAULT_N_SHARDS));
  return shardCount * (shardCount * DIGEST_LEN_BYTES * 2n + BLOB_ID_LEN_BYTES);
};

function calculateEncodedSizeBigInt(
  rawSizeBytes: number,
  nShards: number,
): bigint {
  const shardCount = toPositiveInteger(nShards, DEFAULT_N_SHARDS);
  const maxFaulty = getMaxFaultyNodes(shardCount);
  const primarySymbols = shardCount - 2 * maxFaulty;
  const secondarySymbols = shardCount - maxFaulty;
  const sourceSymbols = BigInt(primarySymbols) * BigInt(secondarySymbols);

  let unencodedLength = BigInt(toNonNegativeInteger(rawSizeBytes));
  if (unencodedLength === 0n) {
    unencodedLength = 1n;
  }

  let symbolSize = (unencodedLength - 1n) / sourceSymbols + 1n;
  if (symbolSize % RS2_SYMBOL_ALIGNMENT !== 0n) {
    symbolSize += 1n;
  }

  const sliversSize =
    BigInt(shardCount) * BigInt(primarySymbols + secondarySymbols) * symbolSize;
  return sliversSize + calculateMetadataSizeBytesBigInt(shardCount);
}

const frostBigIntToWal = (frost: bigint): number => {
  const whole = frost / BigInt(FROST_PER_WAL);
  const fractional = frost % BigInt(FROST_PER_WAL);
  return Number(whole) + Number(fractional) / FROST_PER_WAL;
};

/**
 * Pricing information from Walrus system.
 * All prices are in FROST (1 WAL = 1,000,000,000 FROST).
 *
 * Despite field names, values are per storage unit (1 MiB).
 */
export interface WalrusPricing {
  storagePerMbPerEpoch: number; // FROST per storage unit per epoch
  uploadPerMb: number; // FROST per storage unit (one-time write fee)
  nShards: number; // Committee shard count for encoded-size calculation
  storageUnitBytes: number; // Billing unit size in bytes (1 MiB)
  timestamp: number; // Fetch timestamp
  network: "testnet" | "mainnet";
  subsidyRate?: number; // User-facing subsidy rate (0..1)
}

/**
 * Fallback pricing used only when live Walrus system queries fail.
 * Keep these conservative and close to current network defaults.
 * Values below were observed from `systemState()` on February 7, 2026.
 */
const FALLBACK_PRICING_MAINNET: WalrusPricing = {
  storagePerMbPerEpoch: 11_000,
  uploadPerMb: 20_000,
  nShards: DEFAULT_N_SHARDS,
  storageUnitBytes: STORAGE_UNIT_BYTES,
  timestamp: Date.now(),
  network: "mainnet",
  subsidyRate: 0,
};

const FALLBACK_PRICING_TESTNET: WalrusPricing = {
  storagePerMbPerEpoch: 1_000,
  uploadPerMb: 2_000,
  nShards: DEFAULT_N_SHARDS,
  storageUnitBytes: STORAGE_UNIT_BYTES,
  timestamp: Date.now(),
  network: "testnet",
  // Testnet currently has no subsidy object configured in app config.
  subsidyRate: 0,
};

const getFallbackPricing = (network: "testnet" | "mainnet"): WalrusPricing => {
  const fallbackTemplate =
    network === "testnet" ? FALLBACK_PRICING_TESTNET : FALLBACK_PRICING_MAINNET;
  return {
    ...fallbackTemplate,
    timestamp: Date.now(),
  };
};

interface PricingCache {
  pricing: WalrusPricing | null;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const pricingCache: Record<string, PricingCache> = {};

const createPricingWalrusClient = (
  suiClient: SuiClient,
  network: "testnet" | "mainnet",
): WalrusClient => {
  return new WalrusClient({
    suiClient,
    network,
    wasmUrl: walrusWasmUrl,
  });
};

/**
 * Query Walrus subsidy object for discount rate.
 */
async function querySubsidyRate(
  suiClient: SuiClient,
  network: "testnet" | "mainnet",
): Promise<number> {
  const config = getContractConfig(network);
  const subsidyObjectId = config.walrus.subsidyObjectId;

  if (!subsidyObjectId) {
    return 0;
  }

  try {
    const subsidyObject = await suiClient.getObject({
      id: subsidyObjectId,
      options: { showContent: true },
    });

    const fieldsRecord = getMoveObjectFields(subsidyObject.data?.content);
    if (!fieldsRecord) {
      throw new Error("Invalid subsidy object structure");
    }

    const buyerRate = getNumericField(fieldsRecord, "buyer_subsidy_rate");
    const systemRate = getNumericField(fieldsRecord, "system_subsidy_rate");
    const rawRate = buyerRate ?? systemRate ?? 0;
    return normalizeOnChainSubsidyRate(rawRate);
  } catch (error) {
    console.warn(`Failed to query subsidy rate for ${network}:`, error);
    return 0;
  }
}

/**
 * Query Walrus system state through the official Walrus SDK.
 */
async function querySystemPricing(
  suiClient: SuiClient,
  network: "testnet" | "mainnet",
  walrusClient?: WalrusClient,
): Promise<WalrusPricing> {
  const fallback = getFallbackPricing(network);

  try {
    const client = walrusClient ?? createPricingWalrusClient(suiClient, network);
    const systemState = await client.systemState();

    const storagePerUnit = Number(systemState.storage_price_per_unit_size);
    const writePerUnit = Number(systemState.write_price_per_unit_size);
    const nShards = Number(systemState.committee.n_shards);

    if (
      !Number.isFinite(storagePerUnit) ||
      !Number.isFinite(writePerUnit) ||
      !Number.isFinite(nShards)
    ) {
      throw new Error("Invalid numeric values in Walrus system state");
    }

    const subsidyRate = await querySubsidyRate(suiClient, network);

    return {
      storagePerMbPerEpoch: Math.max(0, Math.round(storagePerUnit)),
      uploadPerMb: Math.max(0, Math.round(writePerUnit)),
      nShards: toPositiveInteger(nShards, DEFAULT_N_SHARDS),
      storageUnitBytes: STORAGE_UNIT_BYTES,
      timestamp: Date.now(),
      network,
      subsidyRate,
    };
  } catch (error) {
    console.warn(
      `Failed to query Walrus system pricing for ${network}:`,
      error,
    );
    console.warn("Using fallback pricing estimates");
    return fallback;
  }
}

export async function getWalrusPricing(
  suiClient: SuiClient,
  network: "testnet" | "mainnet",
  walrusClient?: WalrusClient,
): Promise<WalrusPricing> {
  const cacheKey = network;
  const cached = pricingCache[cacheKey];

  if (cached && cached.expiresAt > Date.now() && cached.pricing) {
    return cached.pricing;
  }

  const pricing = await querySystemPricing(suiClient, network, walrusClient);
  pricingCache[cacheKey] = {
    pricing,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };

  return pricing;
}

const calculateMetadataSizeBytes = (nShards = DEFAULT_N_SHARDS): number =>
  Number(calculateMetadataSizeBytesBigInt(nShards));

const calculateCostsFromPricing = (
  encodedSizeBytes: bigint,
  pricing: WalrusPricing,
  epochs: number,
): {
  storageCostWal: number;
  uploadCostWal: number;
  totalCostWal: number;
} => {
  const storageUnitBytes = BigInt(
    toPositiveInteger(pricing.storageUnitBytes, STORAGE_UNIT_BYTES),
  );
  const billingUnits = (encodedSizeBytes + storageUnitBytes - 1n) / storageUnitBytes;

  const storagePricePerUnitPerEpoch = BigInt(
    toNonNegativeInteger(pricing.storagePerMbPerEpoch),
  );
  const writePricePerUnit = BigInt(toNonNegativeInteger(pricing.uploadPerMb));
  const epochsBigInt = BigInt(toPositiveInteger(epochs));

  const storageCostFrost =
    billingUnits * storagePricePerUnitPerEpoch * epochsBigInt;
  const uploadCostFrost = billingUnits * writePricePerUnit;
  const totalCostFrost = storageCostFrost + uploadCostFrost;

  return {
    storageCostWal: frostBigIntToWal(storageCostFrost),
    uploadCostWal: frostBigIntToWal(uploadCostFrost),
    totalCostWal: frostBigIntToWal(totalCostFrost),
  };
};

/**
 * Calculate total storage cost for campaign files.
 * Includes storage reservation + write fee and optional subsidy display.
 */
export interface CampaignStorageCost {
  rawSize: number;
  encodedSize: number;
  metadataSize: number;
  storageCostWal: number;
  uploadCostWal: number;
  totalCostWal: number;
  subsidizedStorageCost: number;
  subsidizedUploadCost: number;
  subsidizedTotalCost: number;
  epochs: number;
  pricing: WalrusPricing;
}

export async function calculateCampaignStorageCost(
  suiClient: SuiClient,
  network: "testnet" | "mainnet",
  rawSizeBytes: number,
  epochs: number,
): Promise<CampaignStorageCost> {
  const normalizedRawSize = toNonNegativeInteger(rawSizeBytes);
  const normalizedEpochs = toPositiveInteger(epochs);
  const walrusClient = createPricingWalrusClient(suiClient, network);

  const [pricing, sdkCostResult] = await Promise.all([
    getWalrusPricing(suiClient, network, walrusClient),
    walrusClient
      .storageCost(normalizedRawSize, normalizedEpochs)
      .then((cost) => ({ ok: true as const, cost }))
      .catch((error: unknown) => ({ ok: false as const, error })),
  ]);

  const encodedSizeBigInt = calculateEncodedSizeBigInt(
    normalizedRawSize,
    pricing.nShards,
  );
  const encodedSize = Number(encodedSizeBigInt);
  const metadataSize = calculateMetadataSizeBytes(pricing.nShards);

  let storageCostWal: number;
  let uploadCostWal: number;
  let totalCostWal: number;

  if (sdkCostResult.ok) {
    // Source of truth for WAL charging is the SDK's storageCost path, which matches register logic.
    storageCostWal = frostBigIntToWal(sdkCostResult.cost.storageCost);
    uploadCostWal = frostBigIntToWal(sdkCostResult.cost.writeCost);
    totalCostWal = frostBigIntToWal(sdkCostResult.cost.totalCost);
  } else {
    console.warn(
      `Walrus storageCost failed for ${network}; falling back to price-based estimation.`,
      sdkCostResult.error,
    );
    const fallbackCost = calculateCostsFromPricing(
      encodedSizeBigInt,
      pricing,
      normalizedEpochs,
    );
    storageCostWal = fallbackCost.storageCostWal;
    uploadCostWal = fallbackCost.uploadCostWal;
    totalCostWal = fallbackCost.totalCostWal;
  }

  const subsidyRate = clampSubsidyRate(pricing.subsidyRate ?? 0);
  const subsidyMultiplier = Math.max(0, 1 - subsidyRate);

  const subsidizedStorageCost = storageCostWal * subsidyMultiplier;
  const subsidizedUploadCost = uploadCostWal * subsidyMultiplier;
  const subsidizedTotalCost = totalCostWal * subsidyMultiplier;

  return {
    rawSize: normalizedRawSize,
    encodedSize,
    metadataSize,
    storageCostWal,
    uploadCostWal,
    totalCostWal,
    subsidizedStorageCost,
    subsidizedUploadCost,
    subsidizedTotalCost,
    epochs: normalizedEpochs,
    pricing,
  };
}

/**
 * Clear pricing cache (useful for tests/dev tooling).
 */
export function clearPricingCache(): void {
  Object.keys(pricingCache).forEach((key) => delete pricingCache[key]);
}
