import { indexerRequest } from "./client";
import type { PolicyResponse } from "./types";

/** List enabled payout policies. */
export async function getPolicies(): Promise<PolicyResponse[]> {
  return indexerRequest<PolicyResponse[]>("/v1/policies");
}
