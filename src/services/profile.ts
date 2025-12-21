import type { TransactionObjectArgument } from "@mysten/sui/transactions";
import { Transaction } from "@mysten/sui/transactions";

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
