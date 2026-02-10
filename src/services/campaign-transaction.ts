/**
 * Campaign Transaction Builder Service
 *
 * This service handles building Sui transactions for campaign operations,
 * including campaign creation, updates, and other on-chain interactions.
 */

import { Transaction } from "@mysten/sui/transactions";
import type {
  CampaignFormData,
  CampaignMetadata,
  MetadataPatch,
} from "@/features/campaigns/types/campaign";
import { DESCRIPTION_MAX_LENGTH } from "@/features/campaigns/constants/validation";
import {
  serializeSocialLinks,
  sanitizeSocialLinks,
} from "@/features/campaigns/utils/socials";
import { getContractConfig, CLOCK_OBJECT_ID } from "@/shared/config/contracts";
import { WALRUS_EPOCH_CONFIG } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";
import { parseUsdToMicros } from "@/shared/utils/currency";
import {
  formatSubdomain,
  SUBDOMAIN_MAX_LENGTH,
  SUBDOMAIN_MIN_LENGTH,
  SUBDOMAIN_PATTERN,
} from "@/shared/utils/subdomain";
interface ObjectChange {
  type?: string;
  objectType?: string;
  objectId?: string;
}


const getObjectChanges = (value: unknown): ObjectChange[] => {
  if (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { objectChanges?: unknown }).objectChanges)
  ) {
    return (value as { objectChanges: unknown[] }).objectChanges.filter(
      (change): change is ObjectChange =>
        typeof change === "object" && change !== null,
    );
  }
  return [];
};

/**
 * Build a transaction to create a new campaign on Sui
 */
export function buildCreateCampaignTransaction(
  formData: CampaignFormData,
  walrusBlobId: string,
  network: SupportedNetwork,
  storageEpochs?: number,
): Transaction {
  const config = getContractConfig(network);
  const tx = new Transaction();

  // Use provided epochs or fall back to network default
  const networkKey = (network === "devnet" ? "devnet" : network) as keyof typeof WALRUS_EPOCH_CONFIG;
  const epochConfig = WALRUS_EPOCH_CONFIG[networkKey];
  const minEpochs = epochConfig.minEpochs ?? 1;
  const requestedEpochs =
    typeof storageEpochs === "number" && Number.isFinite(storageEpochs)
      ? storageEpochs
      : epochConfig.defaultEpochs;
  const epochs = Math.min(
    Math.max(requestedEpochs, minEpochs),
    epochConfig.maxEpochs,
  );

  // Prepare metadata for VecMap<String, String>
  const { keys, values } = prepareMetadataVectors(
    formData,
    walrusBlobId,
    epochs,
  );

  // Convert dates to Unix timestamps in milliseconds (UTC) and typed funding/policy fields
  const startDateMs = BigInt(formData.start_date.getTime());
  const endDateMs = BigInt(formData.end_date.getTime());
  const fundingGoalUsdMicros = parseUsdToMicros(formData.funding_goal);
  const policyPresetName = formData.policyPresetName.trim();

  // Append configured SuiNS domain when user only provides the label
  const fullSubdomain = formatSubdomain(
    formData.subdomain_name,
    config.campaignDomain,
  );

  console.log("\n=== BUILDING SUI TRANSACTION ===");
  console.log("Network:", network);
  console.log("Package ID:", config.contracts.packageId);
  console.log("CrowdWalrus Object:", config.contracts.crowdWalrusObjectId);
  console.log("SuiNS Manager:", config.contracts.suinsManagerObjectId);
  console.log("SuiNS Object:", config.contracts.suinsObjectId);
  console.log("\n--- Transaction Arguments ---");
  console.log("Campaign Name:", formData.name);
  console.log("Short Description:", formData.short_description);
  console.log("Subdomain Name (original):", formData.subdomain_name);
  console.log("Subdomain Name (full):", fullSubdomain);
  console.log("Recipient Address:", formData.recipient_address);
  console.log("Start Date (ms):", startDateMs.toString());
  console.log("End Date (ms):", endDateMs.toString());
  console.log("Funding Goal (USD micros):", fundingGoalUsdMicros.toString());
  console.log(
    "Policy Preset:",
    policyPresetName ?? "(default on-chain preset)",
  );
  console.log("\n--- Metadata VecMap ---");
  console.log("Keys:", keys);
  console.log("Values:", values);
  console.log("================================\n");

  // Build the move call
  tx.moveCall({
    target: `${config.contracts.packageId}::crowd_walrus::create_campaign`,
    arguments: [
      // CrowdWalrus shared object
      tx.object(config.contracts.crowdWalrusObjectId),

      // Policy registry shared object
      tx.object(config.contracts.policyRegistryObjectId),

      // Profiles registry shared object
      tx.object(config.contracts.profilesRegistryObjectId),

      // SuiNS Manager
      tx.object(config.contracts.suinsManagerObjectId),

      // SuiNS registry
      tx.object(config.contracts.suinsObjectId),

      // Clock object
      tx.object(CLOCK_OBJECT_ID),

      // Campaign name
      tx.pure.string(formData.name),

      // Short description
      tx.pure.string(formData.short_description),

      // Subdomain name (with network-specific suffix)
      tx.pure.string(fullSubdomain),

      // Metadata keys (vector<String>)
      tx.pure.vector("string", keys),

      // Metadata values (vector<String>)
      tx.pure.vector("string", values),

      // Funding goal in USD micros
      tx.pure.u64(fundingGoalUsdMicros),

      // Recipient address for donations
      tx.pure.address(formData.recipient_address),

      // Policy preset Option<String>
      tx.pure.option("string", policyPresetName),

      // Start date (u64 - Unix timestamp in milliseconds)
      tx.pure.u64(startDateMs),

      // End date (u64 - Unix timestamp in milliseconds)
      tx.pure.u64(endDateMs),
    ],
  });

  return tx;
}

/**
 * Build a transaction to update campaign basics (name / description).
 */
export function buildUpdateCampaignBasicsTransaction(
  campaignId: string,
  ownerCapId: string,
  updates: {
    name?: string;
    short_description?: string;
  },
  network: SupportedNetwork,
): Transaction {
  const config = getContractConfig(network);
  const tx = new Transaction();

  const newName =
    updates.name && updates.name.trim().length > 0
      ? tx.pure.option("string", updates.name.trim())
      : tx.pure.option("string", null);

  const newDescription =
    updates.short_description && updates.short_description.trim().length > 0
      ? tx.pure.option("string", updates.short_description.trim())
      : tx.pure.option("string", null);

  tx.moveCall({
    target: `${config.contracts.packageId}::campaign::update_campaign_basics`,
    arguments: [
      tx.object(campaignId),
      tx.object(ownerCapId),
      newName,
      newDescription,
      tx.object(CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

/**
 * Build a transaction to update campaign metadata (key/value pairs).
 */
export function buildUpdateCampaignMetadataTransaction(
  campaignId: string,
  ownerCapId: string,
  patch: MetadataPatch,
  network: SupportedNetwork,
): Transaction {
  const config = getContractConfig(network);
  const tx = new Transaction();

  const keys: string[] = [];
  const values: string[] = [];

  Object.entries(patch).forEach(([key, value]) => {
    if (
      key === "funding_goal" ||
      key === "recipient_address" ||
      value === undefined
    ) {
      if (key === "funding_goal" || key === "recipient_address") {
        console.warn(
          `Skipping immutable metadata key "${key}". Update will be ignored.`,
        );
      }
      return;
    }

    keys.push(key);
    values.push(value);
  });

  if (keys.length !== values.length) {
    throw new Error(
      `Metadata key/value mismatch: ${keys.length} keys, ${values.length} values`,
    );
  }

  if (keys.length === 0) {
    return tx;
  }

  tx.moveCall({
    target: `${config.contracts.packageId}::campaign::update_campaign_metadata`,
    arguments: [
      tx.object(campaignId),
      tx.object(ownerCapId),
      tx.pure.vector("string", keys),
      tx.pure.vector("string", values),
      tx.object(CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

/**
 * Prepare metadata keys and values for the VecMap<String, String>
 * Returns parallel arrays of keys and values
 */
export function prepareMetadataVectors(
  formData: CampaignFormData,
  walrusBlobId: string,
  storageEpochs: number,
): { keys: string[]; values: string[] } {
  const metadata: CampaignMetadata = {
    walrus_quilt_id: walrusBlobId,
    walrus_storage_epochs: storageEpochs.toString(),
    category: formData.category,
    cover_image_id: "cover.jpg", // Standard identifier in the Quilt
  };

  const socials = sanitizeSocialLinks(formData.socials ?? []);

  if (socials.length > 0) {
    metadata.socials_json = serializeSocialLinks(socials);
  }

  // Convert metadata object to parallel arrays
  const keys = Object.keys(metadata);
  const values = keys.map((key) => metadata[key] as string);

  return { keys, values };
}

/**
 * Build a transaction to add an update to an existing campaign
 */
export function buildAddUpdateTransaction(
  campaignId: string,
  campaignOwnerCapId: string,
  metadata: Record<string, string>,
  network: SupportedNetwork,
): Transaction {
  const config = getContractConfig(network);
  const tx = new Transaction();

  // Prepare metadata vectors
  const keys = Object.keys(metadata);
  const values = Object.values(metadata);

  tx.moveCall({
    target: `${config.contracts.packageId}::campaign::add_update`,
    arguments: [
      // Campaign object
      tx.object(campaignId),

      // Campaign owner capability (authorization)
      tx.object(campaignOwnerCapId),

      // Metadata keys
      tx.pure.vector("string", keys),

      // Metadata values
      tx.pure.vector("string", values),

      // Clock object for timestamping
      tx.object(CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

/**
 * Build a transaction to toggle campaign active status
 */
export function buildToggleActiveTransaction(
  campaignId: string,
  campaignOwnerCapId: string,
  newStatus: boolean,
  network: SupportedNetwork,
): Transaction {
  const config = getContractConfig(network);
  const tx = new Transaction();

  tx.moveCall({
    target: `${config.contracts.packageId}::campaign::update_active_status`,
    arguments: [
      // Campaign object
      tx.object(campaignId),

      // Campaign owner capability
      tx.object(campaignOwnerCapId),

      // Desired active status
      tx.pure.bool(newStatus),

      // Clock object for timestamping
      tx.object(CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

/**
 * Build a transaction to permanently delete a campaign
 */
export function buildDeleteCampaignTransaction(
  campaignId: string,
  campaignOwnerCapId: string,
  network: SupportedNetwork,
): Transaction {
  const config = getContractConfig(network);
  const tx = new Transaction();

  tx.moveCall({
    target: `${config.contracts.packageId}::crowd_walrus::delete_campaign`,
    arguments: [
      // CrowdWalrus shared object
      tx.object(config.contracts.crowdWalrusObjectId),

      // SuiNS manager shared object
      tx.object(config.contracts.suinsManagerObjectId),

      // SuiNS shared object
      tx.object(config.contracts.suinsObjectId),

      // Campaign object
      tx.object(campaignId),

      // Campaign owner capability (authorization)
      tx.object(campaignOwnerCapId),

      // Clock object for timestamping
      tx.object(CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

/**
 * Build a transaction to verify a campaign using a VerifyCap.
 */
export function buildVerifyCampaignTransaction(
  campaignId: string,
  verifyCapId: string,
  network: SupportedNetwork,
): Transaction {
  const config = getContractConfig(network);
  const tx = new Transaction();

  tx.moveCall({
    target: `${config.contracts.packageId}::crowd_walrus::verify_campaign`,
    arguments: [
      tx.object(config.contracts.crowdWalrusObjectId),
      tx.object(verifyCapId),
      tx.object(campaignId),
    ],
  });

  return tx;
}

/**
 * Build a transaction to unverify a campaign using a VerifyCap.
 */
export function buildUnverifyCampaignTransaction(
  campaignId: string,
  verifyCapId: string,
  network: SupportedNetwork,
): Transaction {
  const config = getContractConfig(network);
  const tx = new Transaction();

  tx.moveCall({
    target: `${config.contracts.packageId}::crowd_walrus::unverify_campaign`,
    arguments: [
      tx.object(config.contracts.crowdWalrusObjectId),
      tx.object(verifyCapId),
      tx.object(campaignId),
    ],
  });

  return tx;
}

/**
 * Build a transaction to create a new VerifyCap for a given address.
 */
export function buildCreateVerifyCapTransaction(
  adminCapId: string,
  newVerifierAddress: string,
  network: SupportedNetwork,
): Transaction {
  const config = getContractConfig(network);
  const tx = new Transaction();

  tx.moveCall({
    target: `${config.contracts.packageId}::crowd_walrus::create_verify_cap`,
    arguments: [
      tx.object(config.contracts.crowdWalrusObjectId),
      tx.object(adminCapId),
      tx.pure.address(newVerifierAddress),
    ],
  });

  return tx;
}

/**
 * Extract campaign ID from transaction result
 * Looks for the created Campaign object in the transaction results
 * Note: Expects the full transaction result with objectChanges at top level
 */
export function extractCampaignIdFromEffects(
  result: unknown,
  packageId: string,
): string | null {
  try {
    console.log("\n=== EXTRACTING CAMPAIGN ID ===");
    console.log("Package ID:", packageId);
    console.log("Transaction result:", JSON.stringify(result, null, 2));

    // objectChanges is at the top level of the result object
    const objectChanges = getObjectChanges(result);

  const campaignType = `${packageId}::campaign::Campaign`;

    const campaignChange = objectChanges.find(
      (change) =>
        change?.type === "created" &&
        typeof change.objectType === "string" &&
        (change.objectType === campaignType ||
          // Some Sui responses flatten type names, so defensively match suffix
          change.objectType.endsWith("::campaign::Campaign")),
    );

    console.log("Created objects found:", objectChanges);
    console.log("Campaign change:", campaignChange);

    if (typeof campaignChange?.objectId === "string") {
      const campaignId = campaignChange.objectId;
      console.log("Extracted Campaign ID:", campaignId);
      console.log("==============================\n");
      return campaignId;
    }

    console.log("No Campaign object found in transaction result");
    console.log("==============================\n");
    return null;
  } catch (error) {
    console.error("Error extracting campaign ID from result:", error);
    return null;
  }
}

export function extractCampaignUpdateIdFromEffects(
  result: unknown,
  packageId: string,
): string | null {
  try {
    const objectChanges = getObjectChanges(result);

    const updateType = `${packageId}::campaign::CampaignUpdate`;

    const updateChange = objectChanges.find(
      (change) =>
        change?.type === "created" &&
        typeof change.objectType === "string" &&
        (change.objectType === updateType ||
          change.objectType.endsWith("::campaign::CampaignUpdate")),
    );

    if (typeof updateChange?.objectId === "string") {
      return updateChange.objectId;
    }

    return null;
  } catch (error) {
    console.error("Failed to extract campaign update ID:", error);
    return null;
  }
}

/**
 * Validate campaign form data before transaction
 * Throws errors if validation fails
 */
export function validateCampaignFormData(formData: CampaignFormData): void {
  // Name validation
  if (!formData.name || formData.name.trim().length === 0) {
    throw new Error("Campaign name is required");
  }
  if (formData.name.length > 100) {
    throw new Error("Campaign name must be 100 characters or less");
  }

  // Short description validation
  if (
    !formData.short_description ||
    formData.short_description.trim().length === 0
  ) {
    throw new Error("Short description is required");
  }
  if (formData.short_description.length > DESCRIPTION_MAX_LENGTH) {
    throw new Error(
      `Short description must be ${DESCRIPTION_MAX_LENGTH} characters or less`,
    );
  }

  // Subdomain validation
  const normalizedSubdomain = formData.subdomain_name?.trim() ?? "";
  if (!normalizedSubdomain) {
    throw new Error("Subdomain name is required");
  }
  if (normalizedSubdomain.length < SUBDOMAIN_MIN_LENGTH) {
    throw new Error(
      `Subdomain must be at least ${SUBDOMAIN_MIN_LENGTH} characters`,
    );
  }
  if (normalizedSubdomain.length > SUBDOMAIN_MAX_LENGTH) {
    throw new Error(
      `Subdomain must be ${SUBDOMAIN_MAX_LENGTH} characters or less`,
    );
  }
  if (!SUBDOMAIN_PATTERN.test(normalizedSubdomain)) {
    throw new Error(
      "Subdomain must contain only lowercase letters, numbers, and interior hyphens",
    );
  }

  // Funding goal validation
  if (!formData.funding_goal || parseFloat(formData.funding_goal) <= 0) {
    throw new Error("Funding goal must be greater than 0");
  }

  // Date validation
  if (!formData.start_date || !formData.end_date) {
    throw new Error("Start and end dates are required");
  }
  if (formData.start_date >= formData.end_date) {
    throw new Error("End date must be after start date");
  }

  // Recipient address validation
  if (!formData.recipient_address || formData.recipient_address.trim().length === 0) {
    throw new Error("Recipient address is required");
  }
  if (!/^0x[a-fA-F0-9]+$/.test(formData.recipient_address)) {
    throw new Error("Recipient address must be a valid Sui address");
  }

  // Cover image validation
  if (!formData.cover_image) {
    throw new Error("Cover image is required");
  }
  if (formData.cover_image.size > 10 * 1024 * 1024) {
    // 10MB limit
    throw new Error("Cover image must be less than 10MB");
  }

  // Category validation
  if (!formData.category || formData.category.trim().length === 0) {
    throw new Error("Category is required");
  }

  // Policy preset validation
  if (!formData.policyPresetName || formData.policyPresetName.trim().length === 0) {
    throw new Error("Policy preset must be selected.");
  }
}

/**
 * Get transaction options for better UX
 */
export function getTransactionOptions() {
  return {
    showEffects: true,
    showObjectChanges: true,
    showEvents: true,
  };
}
