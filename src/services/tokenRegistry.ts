import type { SuiClient } from "@mysten/sui/client";
import { parseU64FromMove } from "@/shared/utils/onchainParsing";
import {
  fetchAllDynamicFields,
  type DynamicFieldEntry,
} from "@/services/suiDynamicFields";

export interface TokenRegistryEntry {
  objectId: string;
  coinType: string;
  symbol: string;
  name: string;
  decimals: number;
  /** 32-byte Pyth price feed identifier encoded as a 0x-prefixed hex string. */
  pythFeedId: string;
  pythFeedIdBytes: Uint8Array;
  maxAgeMs: number;
  isEnabled: boolean;
}

// Matches Move types like `crowd_walrus::token_registry::CoinKey<0x2::sui::SUI>`
// and captures the underlying coin type (`0x2::sui::SUI`).
const COIN_KEY_REGEX = /::token_registry::CoinKey<(.+)>$/;

const isMoveObject = (
  value: unknown,
): value is { dataType: string; fields?: Record<string, unknown> } =>
  Boolean(
    value &&
      typeof value === "object" &&
      "dataType" in (value as Record<string, unknown>) &&
      (value as Record<string, unknown>).dataType === "moveObject",
  );

export async function fetchTokenRegistryEntries(
  client: SuiClient,
  registryId: string,
): Promise<TokenRegistryEntry[]> {
  const dynamicFields = await fetchAllDynamicFields(client, registryId);

  const tokens = await Promise.all(
    dynamicFields.map((entry) =>
      loadTokenMetadataFromField(client, registryId, entry),
    ),
  );

  return tokens.filter((token): token is TokenRegistryEntry => Boolean(token));
}

async function loadTokenMetadataFromField(
  client: SuiClient,
  registryId: string,
  entry: DynamicFieldEntry,
): Promise<TokenRegistryEntry | null> {
  try {
    const response = await client.getDynamicFieldObject({
      parentId: registryId,
      name: entry.name,
    });

    const content = response.data?.content;
    if (!isMoveObject(content)) {
      return null;
    }

    const coinType =
      extractCoinType(entry.name?.type) ??
      extractCoinType(
        (content.fields as { name?: { type?: string } })?.name?.type,
      );

    if (!coinType) {
      return null;
    }

    const valueFields = (
      (content.fields as {
        value?: {
          fields?: Record<string, unknown>;
        };
      })?.value?.fields ?? {}
    ) as Record<string, unknown>;

    const symbol = parseStringField(valueFields.symbol, coinType);
    const name = parseStringField(valueFields.name, symbol);
    const decimals = parseNumberField(valueFields.decimals, 0);
    const maxAgeMs = parseU64FromMove(valueFields.max_age_ms, 0);
    const isEnabled = Boolean(valueFields.enabled);
    const pythFeedIdBytes = parseByteVector(valueFields.pyth_feed_id);
    const pythFeedId = bytesToHex(pythFeedIdBytes);

    return {
      objectId:
        typeof response.data?.objectId === "string"
          ? response.data.objectId
          : entry.objectId ?? "",
      coinType,
      symbol,
      name,
      decimals,
      pythFeedId,
      pythFeedIdBytes,
      maxAgeMs,
      isEnabled,
    };
  } catch (error) {
    const identifier = entry.objectId ?? entry.name?.type ?? "unknown";
    console.warn(
      `[tokenRegistry] Failed to fetch metadata for ${identifier}`,
      error,
    );
    return null;
  }
}

function extractCoinType(typeSignature?: string | null): string | null {
  if (typeof typeSignature !== "string" || typeSignature.length === 0) {
    return null;
  }
  const match = typeSignature.match(COIN_KEY_REGEX);
  return match?.[1] ?? null;
}

function parseStringField(value: unknown, fallback: string) {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function parseNumberField(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  if (typeof value === "bigint") {
    return Number(value);
  }
  return fallback;
}

function parseByteVector(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) {
    return value;
  }

  if (Array.isArray(value)) {
    const normalized = value
      .map((entry) => {
        if (typeof entry === "number" && Number.isFinite(entry)) {
          return entry & 0xff;
        }
        if (typeof entry === "string") {
          const parsed = Number(entry);
          return Number.isNaN(parsed) ? null : parsed & 0xff;
        }
        return null;
      })
      .filter((entry): entry is number => entry !== null);
    return new Uint8Array(normalized);
  }

  if (typeof value === "string") {
    const normalized = value.startsWith("0x")
      ? value.slice(2)
      : value;
    if (/^[0-9a-fA-F]*$/.test(normalized) && normalized.length % 2 === 0) {
      const bytes: number[] = [];
      for (let i = 0; i < normalized.length; i += 2) {
        bytes.push(parseInt(normalized.slice(i, i + 2), 16));
      }
      return new Uint8Array(bytes);
    }
  }

  return new Uint8Array();
}

function bytesToHex(bytes: Uint8Array) {
  if (bytes.length === 0) {
    return "0x";
  }
  return (
    "0x" +
    Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
  );
}
