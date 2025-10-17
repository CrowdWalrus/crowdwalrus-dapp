import { useMemo } from "react";
import { useSuiClientQuery } from "@mysten/dapp-kit";

import { getContractConfig } from "@/shared/config/contracts";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";

interface CrowdWalrusFields {
  verified_campaigns_list?: unknown;
  verifiedCampaignsList?: unknown;
}

const isMoveObjectWithFields = (
  content: unknown,
): content is { dataType: "moveObject"; fields?: CrowdWalrusFields } =>
  typeof content === "object" &&
  content !== null &&
  (content as { dataType?: unknown }).dataType === "moveObject";

const normalizeIdValue = (value: unknown): string | null => {
  if (typeof value === "string") {
    return value;
  }
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as { id?: unknown; value?: unknown; fields?: unknown };

  if (typeof candidate.id === "string") {
    return candidate.id;
  }

  if (typeof candidate.value === "string") {
    return candidate.value;
  }

  if (candidate.fields && typeof candidate.fields === "object") {
    const fieldsRecord = candidate.fields as {
      id?: unknown;
      value?: unknown;
    };

    if (typeof fieldsRecord.value === "string") {
      return fieldsRecord.value;
    }

    if (
      fieldsRecord.id &&
      typeof fieldsRecord.id === "object" &&
      fieldsRecord.id !== null &&
      typeof (fieldsRecord.id as { id?: unknown }).id === "string"
    ) {
      return (fieldsRecord.id as { id: string }).id;
    }
  }

  return null;
};

const extractIdVector = (value: unknown): string[] => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeIdValue(item))
      .filter((id): id is string => Boolean(id));
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "fields" in value &&
    Array.isArray((value as { fields?: { contents?: unknown } }).fields?.contents)
  ) {
    const contents = (value as { fields?: { contents?: unknown[] } }).fields?.contents ?? [];
    return contents
      .map((item) => normalizeIdValue(item))
      .filter((id): id is string => Boolean(id));
  }

  return [];
};

export interface UseCrowdWalrusAdminStateOptions {
  network?: SupportedNetwork;
}

export interface UseCrowdWalrusAdminStateResult {
  crowdWalrusId: string;
  verifiedCampaignIds: string[];
  verifiedCampaignIdSet: Set<string>;
  verifiedCampaignCount: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCrowdWalrusAdminState(
  options: UseCrowdWalrusAdminStateOptions = {},
): UseCrowdWalrusAdminStateResult {
  const network = options.network ?? DEFAULT_NETWORK;
  const config = getContractConfig(network);

  const {
    data,
    isPending,
    error,
    refetch,
  } = useSuiClientQuery(
    "getObject",
    {
      id: config.contracts.crowdWalrusObjectId,
      options: {
        showContent: true,
      },
    },
    {
      enabled: Boolean(config.contracts.crowdWalrusObjectId),
    },
  );

  const verifiedCampaignIds = useMemo(() => {
    if (!data?.data) {
      return [];
    }

    const content = data.data.content;
    if (!isMoveObjectWithFields(content)) {
      return [];
    }

    const fields = content.fields ?? {};
    const rawVector =
      fields.verified_campaigns_list ?? fields.verifiedCampaignsList;

    const ids = extractIdVector(rawVector);

    return Array.from(new Set(ids.map((id) => id.toLowerCase())));
  }, [data]);

  const verifiedCampaignIdSet = useMemo(
    () => new Set(verifiedCampaignIds),
    [verifiedCampaignIds],
  );

  return {
    crowdWalrusId: config.contracts.crowdWalrusObjectId,
    verifiedCampaignIds,
    verifiedCampaignIdSet,
    verifiedCampaignCount: verifiedCampaignIds.length,
    isLoading: isPending,
    error: error instanceof Error ? error : null,
    refetch,
  };
}
