import { useMemo } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import type {
  SuiClient,
  SuiObjectResponse,
} from "@mysten/sui/client";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import { useQuery } from "@tanstack/react-query";

import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import { getContractConfig } from "@/shared/config/contracts";
import type { SupportedNetwork } from "@/shared/types/network";
import { parseU64BigIntFromMove } from "@/shared/utils/onchainParsing";
import { PROFILE_METADATA_REMOVED_VALUE } from "@/features/profiles/constants/metadata";

interface VecMapEntry {
  fields?: {
    key?: unknown;
    value?: unknown;
  };
}

interface ProfileMoveFields {
  id?: { id?: string };
  owner?: string;
  badge_levels_earned?: unknown;
  total_usd_micro?: unknown;
  total_donations_count?: unknown;
  metadata?: {
    fields?: {
      contents?: VecMapEntry[];
    };
  };
}

export interface ProfileMetadataEntry {
  key: string;
  value: string;
}

export interface ProfileData {
  objectId: string;
  ownerAddress: string;
  totalUsdMicro: bigint;
  totalDonationsCount: bigint;
  badgeLevelsMask: number;
  metadata: Record<string, string>;
  rawMetadata: Record<string, string>;
  metadataEntries: ProfileMetadataEntry[];
}

type ProfileOwnerType =
  NonNullable<SuiObjectResponse["data"]> extends { owner?: infer T }
    ? T
    : never;

interface ProfileQueryResult {
  profileId: string | null;
  profile: ProfileData | null;
}

export interface UseProfileOptions {
  ownerAddress?: string | null;
  profileId?: string | null;
  network?: SupportedNetwork;
  enabled?: boolean;
}

/**
 * Read-only hook that resolves the caller's profile object by consulting the
 * shared ProfilesRegistry and loading the underlying `profiles::Profile`.
 */
export function useProfile(options: UseProfileOptions = {}) {
  const {
    ownerAddress,
    profileId: providedProfileId,
    network = DEFAULT_NETWORK,
    enabled = true,
  } = options;

  const suiClient = useSuiClient();
  const config = getContractConfig(network);

  const normalizedOwnerAddress = normalizeAddressSafely(ownerAddress);
  const normalizedProfileId = normalizeAddressSafely(providedProfileId);
  const registryId = config.contracts.profilesRegistryObjectId;

  const queryKey = useMemo(
    () => [
      "profile",
      network,
      normalizedOwnerAddress,
      normalizedProfileId,
      registryId,
    ],
    [network, normalizedOwnerAddress, normalizedProfileId, registryId],
  );

  const query = useQuery<ProfileQueryResult, Error>({
    queryKey,
    queryFn: () =>
      fetchProfileData({
        suiClient,
        registryId,
        ownerAddress: normalizedOwnerAddress,
        profileId: normalizedProfileId,
        packageId: config.contracts.packageId,
      }),
    enabled: Boolean(
      enabled && registryId && (normalizedOwnerAddress || normalizedProfileId),
    ),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const profileId = query.data?.profileId ?? null;
  const profile = query.data?.profile ?? null;

  return {
    ...query,
    profile,
    profileId,
    metadata: profile?.metadata ?? {},
    rawMetadata: profile?.rawMetadata ?? {},
    metadataEntries: profile?.metadataEntries ?? [],
    hasProfile: Boolean(profileId && profile),
  };
}

interface FetchProfileOptions {
  suiClient: SuiClient;
  registryId: string;
  ownerAddress: string | null;
  profileId: string | null;
  packageId: string;
}

async function fetchProfileData({
  suiClient,
  registryId,
  ownerAddress,
  profileId,
  packageId,
}: FetchProfileOptions): Promise<ProfileQueryResult> {
  let resolvedProfileId = profileId;

  if (!resolvedProfileId && ownerAddress) {
    resolvedProfileId = await resolveProfileIdFromRegistry({
      suiClient,
      registryId,
      ownerAddress,
      packageId,
    });
  }

  if (!resolvedProfileId) {
    return { profileId: null, profile: null };
  }

  const profile = await loadProfileObject(suiClient, resolvedProfileId);
  return {
    profileId: resolvedProfileId,
    profile,
  };
}

async function resolveProfileIdFromRegistry({
  suiClient,
  registryId,
  ownerAddress,
  packageId,
}: {
  suiClient: SuiClient;
  registryId: string;
  ownerAddress: string;
  packageId: string;
}): Promise<string | null> {
  try {
    const response = await suiClient.getDynamicFieldObject({
      parentId: registryId,
      name: {
        type: `${packageId}::profiles::RegistryKey`,
        value: {
          owner: ownerAddress,
        },
      },
    });

    const content = response.data?.content;
    if (!isMoveObject(content)) {
      return null;
    }

    const value = (content.fields as Record<string, unknown>).value;
    if (typeof value === "string" && value.length > 0) {
      return normalizeAddressSafely(value);
    }

    if (
      value &&
      typeof value === "object" &&
      "fields" in value &&
      value.fields &&
      typeof (value.fields as { id?: string }).id === "string"
    ) {
      return normalizeAddressSafely((value.fields as { id: string }).id);
    }

    return null;
  } catch (error) {
    if (isDynamicFieldMissing(error)) {
      return null;
    }
    throw error instanceof Error ? error : new Error(String(error));
  }
}

async function loadProfileObject(
  suiClient: SuiClient,
  profileId: string,
): Promise<ProfileData | null> {
  try {
    const response = await suiClient.getObject({
      id: profileId,
      options: {
        showContent: true,
        showOwner: true,
      },
    });

    return parseProfileObject(response);
  } catch (error) {
    if (isObjectNotFound(error)) {
      return null;
    }
    throw error instanceof Error ? error : new Error(String(error));
  }
}

function parseProfileObject(response: SuiObjectResponse): ProfileData | null {
  const data = response.data;
  if (!data) {
    return null;
  }

  const content = data.content;
  if (!isMoveObject(content)) {
    return null;
  }

  const fields = content.fields as ProfileMoveFields;
  const metadataEntries = parseMetadataEntries(
    fields.metadata?.fields?.contents ?? [],
  );
  const rawMetadataMap = metadataEntriesToRecord(metadataEntries);
  const metadataMap = normalizeMetadataRecord(rawMetadataMap);
  const sanitizedMetadataEntries = metadataEntries.map(({ key }) => ({
    key,
    value: metadataMap[key] ?? "",
  }));
  const ownerInfo = (response.data?.owner ?? null) as ProfileOwnerType | null;

  return {
    objectId: data.objectId,
    ownerAddress:
      typeof fields.owner === "string"
        ? fields.owner
        : extractAddressFromOwner(ownerInfo) ?? "",
    totalUsdMicro: parseU64BigIntFromMove(fields.total_usd_micro, 0n),
    totalDonationsCount: parseU64BigIntFromMove(
      fields.total_donations_count,
      0n,
    ),
    badgeLevelsMask: Number(fields.badge_levels_earned ?? 0),
    metadata: metadataMap,
    rawMetadata: rawMetadataMap,
    metadataEntries: sanitizedMetadataEntries,
  };
}

function parseMetadataEntries(entries: VecMapEntry[]): ProfileMetadataEntry[] {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => {
      const key = extractString(entry.fields?.key);
      const value = extractString(entry.fields?.value);
      if (!key || !value) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[profiles] Skipping malformed metadata entry",
            entry,
          );
        }
        return null;
      }
      return { key, value };
    })
    .filter((entry): entry is ProfileMetadataEntry => entry !== null);
}

function metadataEntriesToRecord(
  entries: ProfileMetadataEntry[],
): Record<string, string> {
  return entries.reduce<Record<string, string>>((acc, entry) => {
    acc[entry.key] = entry.value;
    return acc;
  }, {});
}

function normalizeMetadataRecord(
  raw: Record<string, string>,
): Record<string, string> {
  const normalized: Record<string, string> = {};
  Object.entries(raw).forEach(([key, value]) => {
    normalized[key] =
      value === PROFILE_METADATA_REMOVED_VALUE ? "" : value;
  });
  return normalized;
}

function extractString(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as {
    value?: unknown;
    fields?: Record<string, unknown>;
    contents?: unknown;
  };

  if (typeof candidate.value === "string") {
    return candidate.value;
  }

  if (candidate.fields) {
    if (typeof candidate.fields.value === "string") {
      return candidate.fields.value;
    }
    if (typeof candidate.fields.contents === "string") {
      return candidate.fields.contents;
    }
    if (
      Array.isArray(candidate.fields.contents) &&
      candidate.fields.contents.length > 0 &&
      typeof candidate.fields.contents[0] === "string"
    ) {
      return candidate.fields.contents[0] as string;
    }
  }

  if (typeof candidate.contents === "string") {
    return candidate.contents;
  }

  return null;
}

function normalizeAddressSafely(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    return normalizeSuiAddress(value.trim());
  } catch {
    return null;
  }
}

function isMoveObject(
  value: unknown,
): value is { dataType?: string; fields?: Record<string, unknown> } {
  return Boolean(
    value &&
      typeof value === "object" &&
      "dataType" in value &&
      (value as { dataType: string }).dataType === "moveObject",
  );
}

function isDynamicFieldMissing(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "dynamicFieldNotFound"
  ) {
    return true;
  }

  const message = extractErrorMessage(error);
  return message.includes("DynamicField");
}

function isObjectNotFound(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "objectNotFound"
  ) {
    return true;
  }

  const message = extractErrorMessage(error);
  return message.includes("ObjectNotFound");
}

function extractErrorMessage(error: unknown) {
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message ?? "";
  }
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return "";
}

function extractAddressFromOwner(
  owner?: ProfileOwnerType | null,
): string | null {
  if (!owner || typeof owner !== "object") {
    return null;
  }

  if ("AddressOwner" in owner && typeof owner.AddressOwner === "string") {
    return owner.AddressOwner;
  }

  return null;
}

// Re-export metadata utilities for consumers that only need read access.
export type { ProfileMetadataUpdate } from "@/services/profile";
export {
  PROFILE_METADATA_KEYS,
  PROFILE_METADATA_REMOVED_VALUE,
} from "@/features/profiles/constants/metadata";
