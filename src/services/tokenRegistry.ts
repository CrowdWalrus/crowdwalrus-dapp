import { getTokens, type TokenResponse } from "@/services/indexer-services";
import { canonicalizeCoinType } from "@/shared/utils/sui";

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

function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (!normalized || normalized.length % 2 !== 0) {
    return new Uint8Array();
  }
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = Number.parseInt(normalized.slice(i, i + 2), 16);
  }
  return bytes;
}

function mapToken(token: TokenResponse): TokenRegistryEntry {
  const coinType = canonicalizeCoinType(token.coinType);
  const pythFeedId = token.pythFeedIdHex.startsWith("0x")
    ? token.pythFeedIdHex
    : `0x${token.pythFeedIdHex}`;

  return {
    objectId: coinType,
    coinType,
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    pythFeedId,
    pythFeedIdBytes: hexToBytes(pythFeedId),
    maxAgeMs: token.maxAgeMs,
    isEnabled: token.enabled,
  };
}

/** Return enabled token registry entries derived from the indexer token list. */
export async function fetchTokenRegistryEntries(): Promise<TokenRegistryEntry[]> {
  const tokens = await getTokens();
  return tokens.map(mapToken);
}
