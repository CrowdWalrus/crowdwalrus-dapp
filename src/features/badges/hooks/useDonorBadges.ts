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

    return profileQuery.data.badges.flatMap((badge) => {
      const highestLevel = Math.max(0, badge.level ?? 0);
      if (highestLevel === 0) return [];
      console.log("badge", badge);
      console.log("highestLevel", highestLevel);
      return Array.from({ length: highestLevel }, (_, idx) => {
        const level = idx + 1;
        return {
          objectId: `${badge.txDigest ?? badge.profileId}-${level}`,
          level,
          ownerAddress: badge.owner,
          imageUrl: buildBadgeImagePath(level),
          issuedAtMs: BigInt(badge.timestampMs ?? 0),
        };
      });
    });
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
