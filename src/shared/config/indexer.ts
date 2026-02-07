import type { SupportedNetwork } from "@/shared/types/network";
import { resolveRuntimeNetwork } from "./runtimeNetwork";

/**
 * Indexer base URLs by network.
 * Keep API routing aligned with runtime chain routing.
 */
const INDEXER_BASE_URLS: Record<SupportedNetwork, string> = {
  devnet: "https://indexer-testnet.crowdwalrus.xyz",
  testnet: "https://indexer-testnet.crowdwalrus.xyz",
  mainnet: "https://indexer-mainnet.crowdwalrus.xyz",
};

/** Resolved indexer base URL from current hostname (no trailing slash). */
const INDEXER_BASE_URL_RAW =
  INDEXER_BASE_URLS[resolveRuntimeNetwork()];

/** Canonical Indexer base URL (no trailing slash). */
export const INDEXER_BASE_URL = INDEXER_BASE_URL_RAW.replace(/\/$/, "");

/**
 * Helper to build an indexer URL with optional query params.
 * Ensures leading/trailing slashes are handled consistently.
 */
export function resolveIndexerUrl(
  path: string,
  query?: Record<string, string | number | boolean | null | undefined>,
) {
  const base = INDEXER_BASE_URL.endsWith("/")
    ? INDEXER_BASE_URL
    : `${INDEXER_BASE_URL}/`;
  const sanitizedPath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(sanitizedPath, base);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      url.searchParams.set(key, String(value));
    });
  }

  return url;
}
