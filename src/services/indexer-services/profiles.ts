import { indexerRequest } from "./client";
import type { ProfileResponse } from "./types";

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
