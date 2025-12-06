import { indexerRequest } from "./client";
import type {
  CampaignDetail,
  CampaignResolutionResponse,
  CampaignSummary,
  CampaignUpdateResponse,
  DonationResponse,
  PaginatedResponse,
  SubdomainResponse,
} from "./types";

export interface CampaignListParams {
  page?: number;
  pageSize?: number;
  verified?: boolean;
}

const MAX_PAGE_SIZE = 100;

function clampPageSize(pageSize?: number) {
  if (!pageSize) return undefined;
  return Math.max(1, Math.min(pageSize, MAX_PAGE_SIZE));
}

/** Fetch paginated campaign summaries; optionally filter to verified only. */
export async function getCampaigns(
  params: CampaignListParams = {},
): Promise<PaginatedResponse<CampaignSummary>> {
  const { page, pageSize, verified } = params;
  const path = verified ? "/v1/campaigns/verified" : "/v1/campaigns";
  return indexerRequest<PaginatedResponse<CampaignSummary>>(path, {
    query: {
      page,
      page_size: clampPageSize(pageSize),
    },
  });
}

/** Fetch full campaign detail by campaign ID **or** subdomain label. */
export async function getCampaignById(id: string): Promise<CampaignDetail> {
  return indexerRequest<CampaignDetail>(`/v1/campaigns/${id}`);
}

/** Resolve campaign identifier to canonical campaign ID and configured subdomain. */
export async function resolveCampaignIdentifier(
  idOrSubdomain: string,
): Promise<CampaignResolutionResponse> {
  return indexerRequest<CampaignResolutionResponse>(
    `/v1/campaigns/resolve/${encodeURIComponent(idOrSubdomain)}`,
  );
}

export interface CampaignUpdatesParams {
  id: string;
  page?: number;
  pageSize?: number;
}

/** Fetch paginated update entries for a campaign. */
export async function getCampaignUpdates(
  params: CampaignUpdatesParams,
): Promise<PaginatedResponse<CampaignUpdateResponse>> {
  const { id, page, pageSize } = params;
  return indexerRequest<PaginatedResponse<CampaignUpdateResponse>>(
    `/v1/campaigns/${id}/updates`,
    {
      query: {
        page,
        page_size: clampPageSize(pageSize),
      },
    },
  );
}

export interface CampaignDonationsParams {
  id: string;
  page?: number;
  pageSize?: number;
}

/** Fetch paginated donations for a campaign. */
export async function getCampaignDonations(
  params: CampaignDonationsParams,
): Promise<PaginatedResponse<DonationResponse>> {
  const { id, page, pageSize } = params;
  return indexerRequest<PaginatedResponse<DonationResponse>>(
    `/v1/campaigns/${id}/donations`,
    {
      query: {
        page,
        page_size: clampPageSize(pageSize),
      },
    },
  );
}

export interface CampaignSubdomainsParams {
  id: string;
  page?: number;
  pageSize?: number;
}

/** Fetch paginated SuiNS subdomains associated with a campaign. */
export async function getCampaignSubdomains(
  params: CampaignSubdomainsParams,
): Promise<PaginatedResponse<SubdomainResponse>> {
  const { id, page, pageSize } = params;
  return indexerRequest<PaginatedResponse<SubdomainResponse>>(
    `/v1/campaigns/${id}/subdomains`,
    {
      query: {
        page,
        page_size: clampPageSize(pageSize),
      },
    },
  );
}
