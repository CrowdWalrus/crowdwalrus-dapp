/**
 * Default development indexer endpoint. Override with `VITE_INDEXER_BASE_URL`
 * when running in other environments.
 */
const DEFAULT_INDEXER_BASE_URL = "http://98.80.250.83:9285";

const envBaseUrl =
  typeof import.meta !== "undefined" && "env" in import.meta
    ? (import.meta as { env?: Record<string, string> }).env?.VITE_INDEXER_BASE_URL
    : undefined;

const normalizedBaseUrl = (envBaseUrl || DEFAULT_INDEXER_BASE_URL).trim();

/** Canonical Indexer base URL (no trailing slash). Configure via `VITE_INDEXER_BASE_URL`. */
export const INDEXER_BASE_URL = normalizedBaseUrl.replace(/\/$/, "");

/**
 * Helper to build an indexer URL with optional query params.
 * Ensures leading/trailing slashes are handled consistently.
 */
export function resolveIndexerUrl(path: string, query?: Record<string, string | number | boolean | null | undefined>) {
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
