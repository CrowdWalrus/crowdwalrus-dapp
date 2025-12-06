import { indexerRequest } from "./client";
import type { TokenResponse } from "./types";

/** List enabled tokens from the indexer token registry view. */
export async function getTokens(): Promise<TokenResponse[]> {
  return indexerRequest<TokenResponse[]>("/v1/tokens");
}
