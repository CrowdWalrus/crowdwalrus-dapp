/**
 * Indexer base URL for the CrowdWalrus API.
 * This is hardcoded because Walrus Sites (decentralized static hosting)
 * does not support runtime environment variables.
 */
const INDEXER_BASE_URL_RAW = "https://indexer.crowdwalrus.xyz";

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
