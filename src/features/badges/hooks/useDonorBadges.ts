import { useMemo } from "react";
import { useSuiClientQuery } from "@mysten/dapp-kit";
import type { SuiObjectResponse } from "@mysten/sui/client";
import { normalizeSuiAddress } from "@mysten/sui/utils";

import { getContractConfig } from "@/shared/config/contracts";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";
import { parseU64BigIntFromMove } from "@/shared/utils/onchainParsing";

export interface DonorBadge {
  objectId: string;
  level: number;
  ownerAddress: string;
  imageUrl: string;
  issuedAtMs: bigint;
}

export interface UseDonorBadgesOptions {
  ownerAddress?: string | null;
  network?: SupportedNetwork;
  enabled?: boolean;
}

export interface UseDonorBadgesResult {
  badges: DonorBadge[];
  hasBadges: boolean;
  ownerAddress: string | null;
  isLoading: boolean;
  isFetching: boolean;
  isFetched: boolean;
  error: Error | null;
  refetch: () => void;
}

interface DonorBadgeFields {
  id?: { id?: string };
  level?: number | string;
  owner?: string;
  image_uri?: string;
  issued_at_ms?: unknown;
}

const isMoveObjectWithFields = (
  value: unknown,
): value is { dataType?: string; fields?: DonorBadgeFields } =>
  Boolean(
    value &&
      typeof value === "object" &&
      (value as { dataType?: string }).dataType === "moveObject",
  );

const normalizeAddressSafely = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  try {
    return normalizeSuiAddress(value.trim());
  } catch {
    return null;
  }
};

const parseLevel = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

function parseDonorBadge(
  objectData: SuiObjectResponse["data"],
): DonorBadge | null {
  if (!objectData) {
    return null;
  }

  const content = objectData.content;
  if (!isMoveObjectWithFields(content)) {
    return null;
  }

  const fields: DonorBadgeFields = content.fields ?? {};
  const level = parseLevel(fields.level);
  const imageUrl = typeof fields.image_uri === "string" ? fields.image_uri : "";
  const objectId = objectData.objectId ?? fields.id?.id ?? null;

  if (!level || !imageUrl || !objectId) {
    return null;
  }

  const ownerAddress =
    typeof fields.owner === "string" ? normalizeAddressSafely(fields.owner) : null;
  const issuedAtMs = parseU64BigIntFromMove(fields.issued_at_ms, 0n);

  return {
    objectId,
    level,
    ownerAddress: ownerAddress ?? "",
    imageUrl,
    issuedAtMs,
  };
}

const compareBadges = (a: DonorBadge, b: DonorBadge) => {
  if (a.level !== b.level) {
    return a.level - b.level;
  }

  const diff = a.issuedAtMs - b.issuedAtMs;
  if (diff === 0n) {
    return 0;
  }

  return diff > 0n ? 1 : -1;
};

export function useDonorBadges({
  ownerAddress,
  network = DEFAULT_NETWORK,
  enabled = true,
}: UseDonorBadgesOptions = {}): UseDonorBadgesResult {
  const normalizedOwnerAddress = useMemo(
    () => normalizeAddressSafely(ownerAddress),
    [ownerAddress],
  );

  const config = getContractConfig(network);
  const structType = `${config.contracts.packageId}::badge_rewards::DonorBadge`;
  const queryEnabled = Boolean(enabled && normalizedOwnerAddress);

  const {
    data,
    isPending,
    isFetching,
    isFetched,
    error,
    refetch,
  } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: normalizedOwnerAddress ?? "",
      filter: {
        StructType: structType,
      },
      options: {
        showContent: true,
      },
    },
    {
      enabled: queryEnabled,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    },
  );

  const badges = useMemo(() => {
    if (!data?.data?.length) {
      return [] as DonorBadge[];
    }

    return data.data
      .map((item) => parseDonorBadge(item.data))
      .filter((badge): badge is DonorBadge => Boolean(badge))
      .sort(compareBadges);
  }, [data]);

  return {
    badges,
    hasBadges: badges.length > 0,
    ownerAddress: normalizedOwnerAddress,
    isLoading: isPending,
    isFetching,
    isFetched,
    error: error instanceof Error ? error : null,
    refetch,
  };
}
