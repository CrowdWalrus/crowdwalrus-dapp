import { indexerRequest } from "./client";
import type {
  PaginatedResponse,
  ProfileDonationResponse,
  ProfileIdentityResponse,
  ProfileResolutionResponse,
  ProfileResponse,
} from "./types";

export interface ProfileRequestParams {
  address: string;
  page?: number;
  pageSize?: number;
}

const MAX_PAGE_SIZE = 100;

function clampPageSize(pageSize?: number) {
  if (!pageSize) return undefined;
  return Math.max(1, Math.min(pageSize, MAX_PAGE_SIZE));
}

/** Fetch a profile (plus badges and donations) by owner address. */
export async function getProfileByAddress(
  params: ProfileRequestParams,
): Promise<ProfileResponse> {
  const { address, page, pageSize } = params;
  return indexerRequest<ProfileResponse>(`/v1/profiles/${address}`, {
    query: {
      page,
      page_size: clampPageSize(pageSize),
    },
  });
}

export async function getProfileDonations(
  params: ProfileRequestParams,
): Promise<PaginatedResponse<ProfileDonationResponse>> {
  const { address, page, pageSize } = params;
  return indexerRequest<PaginatedResponse<ProfileDonationResponse>>(
    `/v1/profiles/${address}/donations`,
    {
      query: {
        page,
        page_size: clampPageSize(pageSize),
      },
    },
  );
}

/** Fetch a profile identity (owner + optional registered sub-name) by owner address. */
export async function getProfileIdentityByAddress(
  address: string,
): Promise<ProfileIdentityResponse> {
  return indexerRequest<ProfileIdentityResponse>(
    `/v1/profiles/identity/${encodeURIComponent(address)}`,
  );
}

/** Resolve an address or SuiNS sub-name to a profile owner address. */
export async function resolveProfileIdentifier(
  idOrSubname: string,
): Promise<ProfileResolutionResponse> {
  return indexerRequest<ProfileResolutionResponse>(
    `/v1/profiles/resolve/${encodeURIComponent(idOrSubname)}`,
  );
}
