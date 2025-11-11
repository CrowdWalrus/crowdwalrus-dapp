import type { SuiClient } from "@mysten/sui/client";
import {
  Transaction,
  type TransactionObjectArgument,
} from "@mysten/sui/transactions";
import {
  SuiPriceServiceConnection,
  type HexString,
  type PriceUpdate,
} from "@pythnetwork/pyth-sui-js";
import { Buffer } from "buffer";

import { getContractConfig } from "@/shared/config/contracts";
import type { SupportedNetwork } from "@/shared/types/network";
import type { TokenRegistryEntry } from "@/services/tokenRegistry";
import { CrowdWalrusPythClient } from "@/services/pythClient";

const USD_MICROS_PER_UNIT = 1_000_000n;
const MAX_EXPONENT_ABS = 38;
const MAX_DECIMALS = 38;
const MAX_U64 = (1n << 64n) - 1n;
const BPS_DENOMINATOR = 10_000n;

export interface PriceOracleQuoteOptions {
  network: SupportedNetwork;
  token: TokenRegistryEntry;
  suiClient: SuiClient;
  transaction: Transaction;
  rawAmount: bigint;
}

export interface PriceOracleQuoteResult {
  priceInfoObject: TransactionObjectArgument;
  quotedUsdMicro: bigint;
  publishTimeMs: number;
  feedId: string;
  registryMaxAgeMs: number;
}

export interface PriceOracleQuotePreview {
  quotedUsdMicro: bigint;
  publishTimeMs: number;
  feedId: string;
  registryMaxAgeMs: number;
}

interface PriceQuotePreparationOptions {
  network: SupportedNetwork;
  token: TokenRegistryEntry;
  rawAmount: bigint;
}

interface PreparedPriceQuote extends PriceOracleQuotePreview {
  feedId: HexString;
  priceUpdateData: Buffer[];
}

export interface PriceInfoArgOptions {
  network: SupportedNetwork;
  token: TokenRegistryEntry;
  suiClient: SuiClient;
  transaction: Transaction;
}

const hermesConnections = new Map<string, SuiPriceServiceConnection>();

function getHermesConnection(endpoint: string) {
  const normalized = endpoint.replace(/\/$/, "");
  const cached = hermesConnections.get(normalized);
  if (cached) {
    return cached;
  }
  const connection = new SuiPriceServiceConnection(normalized);
  hermesConnections.set(normalized, connection);
  return connection;
}

/**
 * Fetch a fresh Pyth price update, attach the on-chain price-refresh commands to the
 * provided transaction, and return the hydrated `PriceInfoObject` handle along with a
 * USD preview for slippage controls.
 *
 * Consumers should pass the returned `priceInfoObject` into `donate_*` entries and feed the
 * `quotedUsdMicro` through `applySlippageTolerance` to derive `expected_min_usd_micro`.
 */
export async function attachPriceOracleQuote({
  network,
  token,
  suiClient,
  transaction,
  rawAmount,
}: PriceOracleQuoteOptions): Promise<PriceOracleQuoteResult> {
  const prepared = await preparePriceQuote({ network, token, rawAmount });

  const config = getContractConfig(network);
  const pythClient = new CrowdWalrusPythClient(
    suiClient,
    config.pyth.pythStateId,
    config.pyth.wormholeStateId,
  );
  const priceInfoObjectIds = await pythClient.updatePriceFeeds(
    transaction,
    prepared.priceUpdateData,
    [prepared.feedId],
  );

  if (!priceInfoObjectIds.length || !priceInfoObjectIds[0]) {
    throw new Error("Pyth SDK returned no price info objects to reference.");
  }
  const priceInfoObjectArg = await pythClient.buildSharedObjectArg(
    transaction,
    priceInfoObjectIds[0],
    false,
  );

  return {
    priceInfoObject: priceInfoObjectArg,
    quotedUsdMicro: prepared.quotedUsdMicro,
    publishTimeMs: prepared.publishTimeMs,
    feedId: prepared.feedId,
    registryMaxAgeMs: prepared.registryMaxAgeMs,
  };
}

export async function resolvePriceInfoObjectArg({
  network,
  token,
  suiClient,
  transaction,
}: PriceInfoArgOptions): Promise<TransactionObjectArgument> {
  if (!token.pythFeedId) {
    throw new Error("Token registry entry is missing a Pyth feed id.");
  }
  const config = getContractConfig(network);
  const pythClient = new CrowdWalrusPythClient(
    suiClient,
    config.pyth.pythStateId,
    config.pyth.wormholeStateId,
  );
  const feedId = token.pythFeedId.toLowerCase() as HexString;
  const priceInfoObjectId = await pythClient.getPriceFeedObjectId(feedId);
  if (!priceInfoObjectId) {
    throw new Error(
      `No PriceInfoObject found for feed ${token.symbol} (${token.pythFeedId}).`,
    );
  }
  return pythClient.buildSharedObjectArg(transaction, priceInfoObjectId, false);
}

type ParsedPriceEntry = NonNullable<PriceUpdate["parsed"]>[number];

type EnsuredParsedPrice = ParsedPriceEntry & {
  price: {
    price: string;
    expo: number;
    publish_time: number;
  };
};

function normalizeFeedId(value: string): string {
  return value.startsWith("0x")
    ? value.slice(2).toLowerCase()
    : value.toLowerCase();
}

function extractParsedPrice(
  update: PriceUpdate,
  feedId: string,
): EnsuredParsedPrice {
  const normalizedTargetId = normalizeFeedId(feedId);
  const priceEntry = update.parsed?.find((entry) => {
    if (typeof entry.id !== "string") {
      return false;
    }
    return normalizeFeedId(entry.id) === normalizedTargetId;
  });
  if (!priceEntry || !priceEntry.price) {
    throw new Error(`No parsed price available for feed ${feedId}`);
  }
  return priceEntry as EnsuredParsedPrice;
}

function quoteUsdFromPrice(
  amountRaw: bigint,
  decimals: number,
  priceValue: string,
  expo: number,
): bigint {
  const price = BigInt(priceValue);
  if (price < 0n) {
    throw new Error("Price feed returned a negative price.");
  }
  const expoMagnitude = Math.abs(expo);
  if (expoMagnitude > MAX_EXPONENT_ABS) {
    throw new Error("Price exponent exceeds supported precision.");
  }

  let numerator = amountRaw * price * USD_MICROS_PER_UNIT;
  if (expo > 0) {
    numerator *= pow10BigInt(expoMagnitude);
  }

  let denominator = pow10BigInt(decimals);
  if (expo < 0) {
    denominator *= pow10BigInt(expoMagnitude);
  }

  return numerator / denominator;
}

/**
 * Apply a slippage tolerance (expressed in basis points) to the quoted USD micro amount.
 *
 * @example
 * ```ts
 * const minUsd = applySlippageTolerance(quote.quotedUsdMicro, 100); // 1% slippage
 * ```
 */
export function applySlippageTolerance(
  quotedUsdMicro: bigint,
  toleranceBps: number,
): bigint {
  if (toleranceBps < 0 || toleranceBps > 10_000) {
    throw new Error(
      "Slippage tolerance must be between 0 and 10,000 bps (0%-100%).",
    );
  }
  const tolerance = BigInt(toleranceBps);
  return (quotedUsdMicro * (BPS_DENOMINATOR - tolerance)) / BPS_DENOMINATOR;
}

function pow10BigInt(exp: number): bigint {
  if (exp === 0) {
    return 1n;
  }
  let result = 1n;
  for (let i = 0; i < exp; i += 1) {
    result *= 10n;
  }
  return result;
}

async function preparePriceQuote({
  network,
  token,
  rawAmount,
}: PriceQuotePreparationOptions): Promise<PreparedPriceQuote> {
  if (rawAmount <= 0n) {
    throw new Error("Donation amount must be greater than zero.");
  }
  if (!token.pythFeedId) {
    throw new Error("Token registry entry is missing a Pyth feed id.");
  }
  if (token.decimals < 0 || token.decimals > MAX_DECIMALS) {
    throw new Error("Token decimals exceed supported precision.");
  }
  if (token.pythFeedId.length !== 66) {
    throw new Error(
      `Invalid Pyth feed id length for ${token.symbol}. Expected 66 chars, received ${token.pythFeedId.length}.`,
    );
  }

  const config = getContractConfig(network);
  const hermes = getHermesConnection(config.pyth.hermesUrl);
  const feedId = token.pythFeedId.toLowerCase() as HexString;

  const [latestPriceUpdate, priceUpdateData] = await Promise.all([
    hermes.getLatestPriceUpdates([feedId], { parsed: true }),
    hermes.getPriceFeedsUpdateData([feedId]),
  ]);
  if (!priceUpdateData.length) {
    throw new Error(
      "Hermes returned no price update data for the requested feed.",
    );
  }

  const parsedPrice = extractParsedPrice(latestPriceUpdate, feedId);
  const publishTimeMs = parsedPrice.price.publish_time * 1000;
  const nowMs = Date.now();
  if (token.maxAgeMs > 0 && nowMs - publishTimeMs > token.maxAgeMs) {
    throw new Error(
      `Latest ${token.symbol} price (${new Date(publishTimeMs).toISOString()}) exceeds max_age_ms (${token.maxAgeMs}ms).`,
    );
  }

  const quotedUsdMicro = quoteUsdFromPrice(
    rawAmount,
    token.decimals,
    parsedPrice.price.price,
    parsedPrice.price.expo,
  );
  if (quotedUsdMicro > MAX_U64) {
    throw new Error("USD quote exceeds Move u64 range.");
  }

  const updateBuffers = priceUpdateData.map((entry) => Buffer.from(entry));

  return {
    feedId,
    priceUpdateData: updateBuffers,
    publishTimeMs,
    quotedUsdMicro,
    registryMaxAgeMs: token.maxAgeMs,
  };
}
