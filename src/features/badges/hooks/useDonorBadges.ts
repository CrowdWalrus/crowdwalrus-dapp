import { useMemo } from "react";

import { useProfile } from "@/features/profiles/hooks/useProfile";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";

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

export function useDonorBadges({
  ownerAddress,
  network = DEFAULT_NETWORK,
  enabled = true,
}: UseDonorBadgesOptions = {}): UseDonorBadgesResult {
  const profileQuery = useProfile({ ownerAddress, network, enabled });

  const buildBadgeImagePath = (level: number) =>
    `/assets/images/badges/level${level}.png`;

  const badges = useMemo<DonorBadge[]>(() => {
    if (!profileQuery.data?.badges?.length) {
      return [];
    }

    // Each badge mint row represents a single level; render exactly what exists on-chain.
    const mapped = profileQuery.data.badges
      .filter((badge) => (badge.level ?? 0) > 0)
      .map((badge) => ({
        objectId: `${badge.txDigest ?? badge.profileId}-${badge.level}`,
        level: badge.level,
        ownerAddress: badge.owner,
        imageUrl: buildBadgeImagePath(badge.level),
        issuedAtMs: BigInt(badge.timestampMs ?? 0),
      }));

    // Display left-to-right by ascending level.
    return mapped.sort((a, b) => a.level - b.level || Number(a.issuedAtMs - b.issuedAtMs));
  }, [profileQuery.data?.badges]);

  return {
    badges,
    hasBadges: badges.length > 0,
    ownerAddress: ownerAddress ?? null,
    isLoading: profileQuery.isPending,
    isFetching: profileQuery.isFetching,
    isFetched: profileQuery.isFetched,
    error: (profileQuery.error as Error) ?? null,
    refetch: () => {
      void profileQuery.refetch();
    },
  };
}
