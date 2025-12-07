import { useMemo } from "react";
import { normalizeSuiAddress } from "@mysten/sui/utils";

import { useProfile as useIndexerProfile } from "@/hooks/indexer/useProfile";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";
import type {
  BadgeMintResponse,
  DonationResponse,
  PaginatedResponse,
  ProfileResponse,
} from "@/services/indexer-services";
import { PROFILE_METADATA_REMOVED_VALUE } from "@/features/profiles/constants/metadata";

export interface ProfileMetadataEntry {
  key: string;
  value: string;
}

export interface ProfileData {
  profileId: string;
  ownerAddress: string;
  totalUsdMicro: bigint;
  totalDonationsCount: number;
  badgeLevelsEarned: number;
  metadata: Record<string, string>;
  rawMetadata: Record<string, string>;
  metadataEntries: ProfileMetadataEntry[];
  fundraisingTotals: ProfileFundraisingTotals;
}

export interface ProfileFundraisingTotals {
  totalUsdMicro: bigint;
  recipientTotalUsdMicro: bigint;
}

interface ProfileQueryResult {
  profileId: string | null;
  profile: ProfileData | null;
  badges: BadgeMintResponse[];
  donations: PaginatedResponse<DonationResponse> | null;
}

export interface UseProfileOptions {
  ownerAddress?: string | null;
  profileId?: string | null;
  network?: SupportedNetwork;
  enabled?: boolean;
  pageSize?: number;
}

function normalizeAddressSafely(value?: string | null): string | null {
  if (!value) return null;
  try {
    return normalizeSuiAddress(value.trim());
  } catch {
    return null;
  }
}

function mapMetadataEntries(
  metadata: Record<string, unknown>,
): ProfileMetadataEntry[] {
  return Object.entries(metadata || {}).map(([key, value]) => ({
    key,
    value:
      typeof value === "string"
        ? value
        : typeof value === "number" || typeof value === "boolean"
          ? String(value)
          : JSON.stringify(value),
  }));
}

function normalizeMetadataRecord(
  raw: Record<string, string>,
): Record<string, string> {
  const normalized: Record<string, string> = {};
  Object.entries(raw).forEach(([key, value]) => {
    normalized[key] = value === PROFILE_METADATA_REMOVED_VALUE ? "" : value;
  });
  return normalized;
}

function mapProfileResponse(
  response: ProfileResponse | null | undefined,
): ProfileQueryResult {
  if (!response || !response.profile) {
    return {
      profileId: null,
      profile: null,
      badges: [],
      donations: null,
    };
  }

  const profile = response.profile;
  const metadataEntries = mapMetadataEntries(profile.metadata ?? {});
  const rawMetadata = metadataEntries.reduce<Record<string, string>>(
    (acc, entry) => {
      acc[entry.key] = entry.value;
      return acc;
    },
    {},
  );

  const normalizedMetadata = normalizeMetadataRecord(rawMetadata);

  const fundraisingTotals: ProfileFundraisingTotals = {
    totalUsdMicro: BigInt(profile.fundraisingTotals?.totalUsdMicro ?? 0),
    recipientTotalUsdMicro: BigInt(
      profile.fundraisingTotals?.recipientTotalUsdMicro ?? 0,
    ),
  };

  return {
    profileId: profile.profileId,
    profile: {
      profileId: profile.profileId,
      ownerAddress: profile.owner,
      totalUsdMicro: BigInt(profile.totalUsdMicro ?? 0),
      totalDonationsCount: profile.totalDonationsCount ?? 0,
      badgeLevelsEarned: profile.badgeLevelsEarned ?? 0,
      metadata: normalizedMetadata,
      rawMetadata,
      metadataEntries: Object.entries(normalizedMetadata).map(
        ([key, value]) => ({ key, value }),
      ),
      fundraisingTotals,
    },
    badges: response.badges ?? [],
    donations: response.donations ?? null,
  };
}

/** Read-only hook that resolves a profile by owner address through the indexer API. */
export function useProfile(options: UseProfileOptions = {}) {
  const {
    ownerAddress,
    profileId: providedProfileId,
    network = DEFAULT_NETWORK, // reserved for future multi-network routing
    enabled = true,
    pageSize = 20,
  } = options;
  void network;

  const normalizedOwnerAddress = normalizeAddressSafely(ownerAddress);
  const normalizedProfileId = normalizeAddressSafely(providedProfileId);
  const targetAddress = normalizedOwnerAddress ?? normalizedProfileId;

  const query = useIndexerProfile({
    address: targetAddress,
    pageSize,
    enabled: Boolean(enabled && targetAddress),
  });

  const mapped = useMemo(() => mapProfileResponse(query.data), [query.data]);

  const profileId = mapped.profileId;
  const profile = mapped.profile;

  return {
    ...query,
    profile,
    profileId,
    metadata: profile?.metadata ?? {},
    rawMetadata: profile?.rawMetadata ?? {},
    metadataEntries: profile?.metadataEntries ?? [],
    badges: mapped.badges,
    donations: mapped.donations,
    hasProfile: Boolean(profileId && profile),
  };
}

export type { ProfileMetadataUpdate } from "@/services/profile";
export {
  PROFILE_METADATA_KEYS,
  PROFILE_METADATA_REMOVED_VALUE,
} from "@/features/profiles/constants/metadata";
