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
 * Append keyed metadata updates to an existing transaction, allowing the caller
 * to batch multiple `profiles::update_profile_metadata` calls in a single PTB.
 */
export function appendProfileMetadataUpdates(
  tx: Transaction,
  profileId: string,
  updates: ProfileMetadataUpdate[],
  network: SupportedNetwork = DEFAULT_NETWORK,
): Transaction {
  const config = getContractConfig(network);

  updates.forEach(({ key, value }) => {
    const normalizedKey = key.trim();
    const normalizedValue = value.trim();

    validateMetadataEntry(normalizedKey, normalizedValue);

    tx.moveCall({
      target: `${config.contracts.packageId}::profiles::update_profile_metadata`,
      arguments: [
        tx.object(profileId),
        tx.pure.string(normalizedKey),
        tx.pure.string(normalizedValue),
        tx.object(CLOCK_OBJECT_ID),
      ],
    });
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
