import { INDEXER_BASE_URL, resolveIndexerUrl } from "@/shared/config/indexer";
import type { IndexerErrorResponse } from "./types";

/**
 * Rich error type for indexer HTTP failures. Includes status code and parsed error body when present.
 */
export class IndexerHttpError extends Error {
  status: number;
  code?: string;
  body?: IndexerErrorResponse | null;

  constructor(message: string, status: number, code?: string, body?: IndexerErrorResponse | null) {
    super(message);
    this.name = "IndexerHttpError";
    this.status = status;
    this.code = code;
    this.body = body ?? null;
  }
}

interface RequestOptions {
  query?: Record<string, string | number | boolean | null | undefined>;
  init?: RequestInit;
}

/**
 * Thin wrapper around `fetch` that targets the indexer API and throws an `IndexerHttpError`
 * on non-2xx responses. Automatically parses JSON responses.
 */
export async function indexerRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = resolveIndexerUrl(path, options.query);
  const response = await fetch(url.toString(), {
    ...options.init,
    headers: {
      Accept: "application/json",
      ...(options.init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let parsed: IndexerErrorResponse | null = null;
    try {
      parsed = (await response.json()) as IndexerErrorResponse;
    } catch {
      // ignore json parse errors
    }

    const message = parsed?.message || `Indexer request failed with ${response.status}`;
    throw new IndexerHttpError(message, response.status, parsed?.code, parsed);
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new Error(
      `Failed to parse indexer response from ${INDEXER_BASE_URL}${path}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
