import { useQuery } from "@tanstack/react-query";

import {
  getCampaigns,
  type CampaignSummary,
  type CampaignVerificationStatus,
  type PaginatedResponse,
} from "@/services/indexer-services";

export interface CampaignsPageParams {
  page: number;
  pageSize?: number;
  verificationStatus?: CampaignVerificationStatus;
  verified?: boolean;
  ownerAddress?: string | null;
}

export interface UseCampaignsPageOptions extends CampaignsPageParams {
  enabled?: boolean;
}

const DEFAULT_PAGE_SIZE = 20;

function resolveStatus(
  verificationStatus?: CampaignVerificationStatus,
  verified?: boolean,
): CampaignVerificationStatus {
  return verificationStatus ?? (verified ? "verified" : "all");
}

export function campaignsPageQueryKey(params: CampaignsPageParams) {
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const status = resolveStatus(params.verificationStatus, params.verified);
  return [
    "indexer",
    "campaigns",
    {
      page: params.page,
      pageSize,
      verificationStatus: status,
      ownerAddress: params.ownerAddress ?? null,
    },
  ] as const;
}

export function fetchCampaignsPage(
  params: CampaignsPageParams,
): Promise<PaginatedResponse<CampaignSummary>> {
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const status = resolveStatus(params.verificationStatus, params.verified);
  return getCampaigns({
    page: params.page,
    pageSize,
    verificationStatus: status,
    ownerAddress: params.ownerAddress ?? undefined,
  });
}

/** Page-based campaign query (preferred for numbered pagination). */
export function useCampaignsPage(options: UseCampaignsPageOptions) {
  const { enabled = true, ...params } = options;

  return useQuery<PaginatedResponse<CampaignSummary>, Error>({
    queryKey: campaignsPageQueryKey(params),
    queryFn: () => fetchCampaignsPage(params),
    enabled,
    placeholderData: (previousData, previousQuery) => {
      if (!previousData || !previousQuery) {
        return undefined;
      }

      const prevKey = previousQuery.queryKey as readonly unknown[] | undefined;
      const prevParams = prevKey?.[2] as
        | {
            pageSize?: number;
            verificationStatus?: CampaignVerificationStatus;
            ownerAddress?: string | null;
          }
        | undefined;
      if (!prevParams) {
        return undefined;
      }

      const nextPageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
      const nextStatus = resolveStatus(params.verificationStatus, params.verified);
      const nextOwner = params.ownerAddress ?? null;

      const prevPageSize = prevParams?.pageSize ?? DEFAULT_PAGE_SIZE;
      const prevStatus = prevParams?.verificationStatus ?? "all";
      const prevOwner = prevParams?.ownerAddress ?? null;

      if (
        prevPageSize !== nextPageSize ||
        prevStatus !== nextStatus ||
        prevOwner !== nextOwner
      ) {
        return undefined;
      }

      return previousData;
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
