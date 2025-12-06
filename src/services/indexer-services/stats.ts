import { indexerRequest } from "./client";
import type { StatsResponse } from "./types";

/** Fetch indexer deployment statistics (checkpoint lag, totals, etc.). */
export async function getIndexerStats(): Promise<StatsResponse> {
  return indexerRequest<StatsResponse>("/v1/stats");
}
