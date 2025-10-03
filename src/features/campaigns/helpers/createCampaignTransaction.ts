/**
 * Campaign Transaction Helper
 *
 * Pure function to create a campaign transaction.
 * This is separated from the hook to follow functional programming principles
 * and make it easier to test and reason about.
 */

import { buildCreateCampaignTransaction } from "@/services/campaign-transaction";
import type { CampaignFormData } from "@/features/campaigns/types/campaign";

/**
 * Creates a Sui transaction for campaign creation
 *
 * @param formData - Campaign form data
 * @param walrusBlobId - Blob ID from Walrus upload
 * @param network - Network to deploy on
 * @returns Transaction object ready to be signed and executed
 */
export const createCampaignTransaction = (
  formData: CampaignFormData,
  walrusBlobId: string,
  network: "devnet" | "testnet" | "mainnet" = "testnet"
) => {
  return buildCreateCampaignTransaction(formData, walrusBlobId, network);
};
