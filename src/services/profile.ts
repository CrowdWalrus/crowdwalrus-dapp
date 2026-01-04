import type { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import type { TransactionObjectArgument } from "@mysten/sui/transactions";
import { normalizeSuiAddress } from "@mysten/sui/utils";

import {
  CLOCK_OBJECT_ID,
  getContractConfig,
} from "@/shared/config/contracts";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";

const PROFILE_METADATA_MAX_KEY_LENGTH = 64;
const PROFILE_METADATA_MAX_VALUE_LENGTH = 2048;

export interface ProfileMetadataUpdate {
  key: string;
  value: string;
}

export interface BuildProfileTransactionInput {
  senderAddress: string;
  profileId?: string | null;
  metadataUpdates?: ProfileMetadataUpdate[];
  subdomainFullName?: string | null;
  network?: SupportedNetwork;
}

type MoveObjectContent = {
  dataType: string;
  fields?: Record<string, unknown>;
};

function isMoveObject(content: unknown): content is MoveObjectContent {
  return Boolean(
    content &&
      typeof content === "object" &&
      "dataType" in (content as Record<string, unknown>) &&
      (content as Record<string, unknown>).dataType === "moveObject",
  );
}

function normalizeAddressSafe(value: string): string {
  if (!value) return value;
  try {
    return normalizeSuiAddress(value);
  } catch {
    return value;
  }
}

function bytesToHex(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    return value.startsWith("0x") ? value : `0x${value}`;
  }
  if (Array.isArray(value) && value.every((byte) => typeof byte === "number")) {
    return `0x${value.map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  }
  return null;
}

function extractObjectId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    return normalizeAddressSafe(value);
  }
  if (typeof value !== "object") return null;

  const record = value as Record<string, unknown>;

  if (typeof record.id === "string") {
    return normalizeAddressSafe(record.id);
  }

  if (record.id && typeof record.id === "object") {
    const nested = record.id as Record<string, unknown>;
    if (typeof nested.id === "string") {
      return normalizeAddressSafe(nested.id);
    }
    const bytesHex = bytesToHex(nested.bytes);
    if (bytesHex) return normalizeAddressSafe(bytesHex);
  }

  if (record.fields && typeof record.fields === "object") {
    const fields = record.fields as Record<string, unknown>;
    if (typeof fields.id === "string") {
      return normalizeAddressSafe(fields.id);
    }
    if (fields.id && typeof fields.id === "object") {
      const nested = fields.id as Record<string, unknown>;
      if (typeof nested.id === "string") {
        return normalizeAddressSafe(nested.id);
      }
      const bytesHex = bytesToHex(nested.bytes);
      if (bytesHex) return normalizeAddressSafe(bytesHex);
    }
    const bytesHex = bytesToHex(fields.bytes);
    if (bytesHex) return normalizeAddressSafe(bytesHex);
  }

  return null;
}

function isDynamicFieldNotFoundError(error: unknown): boolean {
  if (!error) return false;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error);
  const lowered = message.toLowerCase();
  return (
    lowered.includes("dynamic field") &&
    (lowered.includes("not found") || lowered.includes("does not exist"))
  );
}

export async function resolveProfileIdOnChain({
  suiClient,
  ownerAddress,
  network = DEFAULT_NETWORK,
}: {
  suiClient: SuiClient;
  ownerAddress: string;
  network?: SupportedNetwork;
}): Promise<string | null> {
  if (!ownerAddress) {
    return null;
  }

  const config = getContractConfig(network);
  const registryId = config.contracts.profilesRegistryObjectId;
  const packageId = config.contracts.packageId;

  if (!registryId?.startsWith("0x") || !packageId?.startsWith("0x")) {
    return null;
  }

  // RegistryKey is a struct with a single `owner: address` field used as the dynamic field key.
  const name = {
    type: `${normalizeAddressSafe(packageId)}::profiles::RegistryKey`,
    value: {
      owner: normalizeAddressSafe(ownerAddress),
    },
  };

  try {
    const fieldObject = await suiClient.getDynamicFieldObject({
      parentId: registryId,
      name,
    });
    const content = fieldObject.data?.content;
    if (!isMoveObject(content)) {
      return null;
    }
    const value = content.fields?.value;
    return extractObjectId(value);
  } catch (error) {
    if (isDynamicFieldNotFoundError(error)) {
      return null;
    }
    console.warn(
      "[profile] failed to resolve profile id from on-chain registry",
      error,
    );
    return null;
  }
}

/**
 * Build a PTB that mints a new profile for the connected wallet.
 */
export function createProfile(
  network: SupportedNetwork = DEFAULT_NETWORK,
): Transaction {
  const tx = new Transaction();
  const config = getContractConfig(network);

  tx.moveCall({
    target: `${config.contracts.packageId}::profiles::create_profile`,
    arguments: [
      tx.object(config.contracts.profilesRegistryObjectId),
      tx.object(CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

/**
 * Build a PTB that conditionally creates a profile, upserts metadata, and/or
 * registers a SuiNS subdomain, all within a single transaction.
 */
export function buildProfileTransaction(
  input: BuildProfileTransactionInput,
): Transaction {
  const {
    senderAddress,
    profileId,
    metadataUpdates = [],
    subdomainFullName,
    network = DEFAULT_NETWORK,
  } = input;

  if (!senderAddress) {
    throw new Error("Sender address is required to build a profile transaction.");
  }

  const tx = new Transaction();
  const config = getContractConfig(network);

  const isCreating = !profileId;
  const profileArg = isCreating
    ? tx.moveCall({
        target: `${config.contracts.packageId}::profiles::create_profile_for_sender`,
        arguments: [
          tx.object(config.contracts.profilesRegistryObjectId),
          tx.object(CLOCK_OBJECT_ID),
        ],
      })[0]!
    : tx.object(profileId);

  appendProfileMetadataUpdates(tx, profileArg, metadataUpdates, network);

  if (subdomainFullName && subdomainFullName.trim().length > 0) {
    appendProfileSubdomainRegistration(
      tx,
      profileArg,
      subdomainFullName.trim(),
      network,
    );
  }

  if (isCreating) {
    tx.moveCall({
      // `Profile` is `key`-only (no `store`), so it cannot be transferred via the
      // PTB `TransferObjects` command. We finalize creation by calling an entry
      // helper that transfers the profile to the sender inside Move.
      target: `${config.contracts.packageId}::profiles::transfer_profile_to_sender`,
      arguments: [profileArg],
    });
  }

  return tx;
}

/**
 * Build a PTB that updates one or more VecMap metadata entries on the
 * caller-owned profile object.
 */
export function updateProfileMetadata(
  profileId: string,
  updates: ProfileMetadataUpdate[],
  network: SupportedNetwork = DEFAULT_NETWORK,
): Transaction {
  if (!profileId) {
    throw new Error("Profile ID is required to update metadata.");
  }
  if (!updates.length) {
    throw new Error("Provide at least one metadata entry to update.");
  }

  const tx = new Transaction();
  appendProfileMetadataUpdates(tx, profileId, updates, network);
  return tx;
}

/**
 * Append metadata upserts to an existing transaction using the new
 * `profiles::upsert_profile_metadata` batch function.
 */
export function appendProfileMetadataUpdates(
  tx: Transaction,
  profile: TransactionObjectArgument | string,
  updates: ProfileMetadataUpdate[],
  network: SupportedNetwork = DEFAULT_NETWORK,
): Transaction {
  if (!updates.length) {
    return tx;
  }

  const config = getContractConfig(network);

  const keys: string[] = [];
  const values: string[] = [];

  updates.forEach(({ key, value }) => {
    const normalizedKey = key.trim();
    const normalizedValue = value.trim();

    validateMetadataEntry(normalizedKey, normalizedValue);

    keys.push(normalizedKey);
    values.push(normalizedValue);
  });

  tx.moveCall({
    target: `${config.contracts.packageId}::profiles::upsert_profile_metadata`,
    arguments: [
      typeof profile === "string" ? tx.object(profile) : profile,
      tx.pure.vector("string", keys),
      tx.pure.vector("string", values),
      tx.object(CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

/**
 * Append a SuiNS subdomain registration call for a profile to an existing PTB.
 */
export function appendProfileSubdomainRegistration(
  tx: Transaction,
  profile: TransactionObjectArgument | string,
  subdomainFullName: string,
  network: SupportedNetwork = DEFAULT_NETWORK,
): Transaction {
  const config = getContractConfig(network);
  const normalizedSubdomain = subdomainFullName.trim();
  if (!normalizedSubdomain) {
    throw new Error("Subdomain is required to register a profile SuiNS name.");
  }

  tx.moveCall({
    target: `${config.contracts.packageId}::crowd_walrus::set_profile_subdomain_public`,
    arguments: [
      typeof profile === "string" ? tx.object(profile) : profile,
      tx.object(config.contracts.suinsManagerObjectId),
      tx.object(config.contracts.suinsObjectId),
      tx.pure.string(normalizedSubdomain),
      tx.object(CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

function validateMetadataEntry(key: string, value: string) {
  if (!key) {
    throw new Error("Metadata keys cannot be empty.");
  }

  if (!value) {
    throw new Error("Metadata values cannot be empty.");
  }

  if (key.length > PROFILE_METADATA_MAX_KEY_LENGTH) {
    throw new Error(
      `Metadata keys must be ${PROFILE_METADATA_MAX_KEY_LENGTH} characters or fewer.`,
    );
  }

  if (value.length > PROFILE_METADATA_MAX_VALUE_LENGTH) {
    throw new Error(
      `Metadata values must be ${PROFILE_METADATA_MAX_VALUE_LENGTH} characters or fewer.`,
    );
  }
}

export const PROFILE_METADATA_LIMITS = {
  KEY_MAX_LENGTH: PROFILE_METADATA_MAX_KEY_LENGTH,
  VALUE_MAX_LENGTH: PROFILE_METADATA_MAX_VALUE_LENGTH,
};

export {
  PROFILE_METADATA_KEYS,
  PROFILE_METADATA_REMOVED_VALUE,
} from "@/features/profiles/constants/metadata";
