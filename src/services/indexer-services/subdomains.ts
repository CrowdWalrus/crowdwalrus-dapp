import { indexerRequest } from "./client";
import type { SubdomainResponse } from "./types";

/** Fetch current subdomain registration data by label. */
export async function getSubdomainByName(name: string): Promise<SubdomainResponse> {
  return indexerRequest<SubdomainResponse>(`/v1/subdomains/${encodeURIComponent(name)}`);
}
