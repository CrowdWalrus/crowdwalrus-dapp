/**
 * Campaign Transaction Builder Service
 *
 * This service handles building Sui transactions for campaign operations,
 * including campaign creation, updates, and other on-chain interactions.
 */

import { Transaction } from "@mysten/sui/transactions";
import type { CampaignFormData, CampaignMetadata } from "@/features/campaigns/types/campaign";
import { getContractConfig, CLOCK_OBJECT_ID } from "@/shared/config/contracts";

/**
 * Build a transaction to create a new campaign on Sui
 */
export function buildCreateCampaignTransaction(
  formData: CampaignFormData,
  walrusBlobId: string,
  network: "devnet" | "testnet" | "mainnet",
): Transaction {
  const config = getContractConfig(network);
  const tx = new Transaction();

  // Prepare metadata for VecMap<String, String>
  const { keys, values } = prepareMetadataVectors(
    formData,
    walrusBlobId,
    config.storageDefaults.defaultEpochs,
  );

  // Convert dates to Unix timestamps (in seconds)
  const startDate = Math.floor(formData.start_date.getTime() / 1000);
  const endDate = Math.floor(formData.end_date.getTime() / 1000);

  // Append .crowdwalrus-test.sui to subdomain for testing
  const fullSubdomain = `${formData.subdomain_name}.crowdwalrus-test.sui`;

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
  console.log("Start Date (u64):", startDate);
  console.log("End Date (u64):", endDate);
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

      // Subdomain name (with .crowdwalrus-test.sui suffix)
      tx.pure.string(fullSubdomain),

      // Metadata keys (vector<String>)
      tx.pure.vector("string", keys),

      // Metadata values (vector<String>)
      tx.pure.vector("string", values),

      // Start date (u64 - Unix timestamp in seconds)
      tx.pure.u64(startDate),

      // End date (u64 - Unix timestamp in seconds)
      tx.pure.u64(endDate),
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
    funding_goal: formData.funding_goal,
    walrus_quilt_id: walrusBlobId,
    walrus_storage_epochs: storageEpochs.toString(),
    category: formData.category,
    cover_image_id: "cover.jpg", // Standard identifier in the Quilt
  };

  // Add optional social links if provided
  if (formData.social_twitter) {
    metadata.social_twitter = formData.social_twitter;
  }
  if (formData.social_discord) {
    metadata.social_discord = formData.social_discord;
  }
  if (formData.social_website) {
    metadata.social_website = formData.social_website;
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
  updateTitle: string,
  updateDescription: string,
  metadata: Record<string, string>,
  network: "devnet" | "testnet" | "mainnet",
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

      // Update title
      tx.pure.string(updateTitle),

      // Update short description
      tx.pure.string(updateDescription),

      // Metadata keys
      tx.pure.vector("string", keys),

      // Metadata values
      tx.pure.vector("string", values),
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
  network: "devnet" | "testnet" | "mainnet",
): Transaction {
  const config = getContractConfig(network);
  const tx = new Transaction();

  tx.moveCall({
    target: `${config.contracts.packageId}::campaign::toggle_active`,
    arguments: [
      // Campaign object
      tx.object(campaignId),

      // Campaign owner capability
      tx.object(campaignOwnerCapId),
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
  result: any,
  packageId: string,
): string | null {
  try {
    console.log("\n=== EXTRACTING CAMPAIGN ID ===");
    console.log("Package ID:", packageId);
    console.log("Transaction result:", JSON.stringify(result, null, 2));

    // objectChanges is at the top level of the result object
    const createdObjects = result?.objectChanges?.filter(
      (change: any) =>
        change.type === "created" &&
        change.objectType?.includes(`${packageId}::campaign::Campaign`),
    );

    console.log("Created objects found:", createdObjects);
    console.log("Number of created objects:", createdObjects?.length || 0);

    if (createdObjects && createdObjects.length > 0) {
      const campaignId = createdObjects[0].objectId;
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
  if (formData.short_description.length > 280) {
    throw new Error("Short description must be 280 characters or less");
  }

  // Subdomain validation
  if (!formData.subdomain_name || formData.subdomain_name.trim().length === 0) {
    throw new Error("Subdomain name is required");
  }
  // Check subdomain format (alphanumeric and hyphens only)
  if (!/^[a-z0-9-]+$/.test(formData.subdomain_name)) {
    throw new Error(
      "Subdomain must contain only lowercase letters, numbers, and hyphens",
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
