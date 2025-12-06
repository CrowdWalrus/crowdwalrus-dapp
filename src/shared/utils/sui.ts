import { normalizeStructTag, SUI_TYPE_ARG } from "@mysten/sui/utils";

/** Ensure a hex string is 0x-prefixed. No validation beyond the prefix. */
export function ensureHexPrefix(value: string): string {
  if (!value) return value;
  return value.startsWith("0x") ? value : `0x${value}`;
}

const NORMALIZED_SUI_TYPE = normalizeStructTag(SUI_TYPE_ARG);

/**
 * Canonicalize a coin/type string to the normalized StructTag form accepted by Sui RPCs.
 * Adds a missing 0x prefix and falls back to the original value if normalization fails.
 */
export function canonicalizeCoinType(value: string): string {
  if (!value) return value;
  const withPrefix = ensureHexPrefix(value);
  try {
    return normalizeStructTag(withPrefix);
  } catch {
    return withPrefix;
  }
}

/** True when the provided coin/type matches the SUI native coin. */
export function isSuiCoinType(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    return canonicalizeCoinType(value) === NORMALIZED_SUI_TYPE;
  } catch {
    return false;
  }
}
