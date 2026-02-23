/**
 * Form Data Transformation Utilities
 *
 * Transforms NewCampaignFormData (from the form) to CampaignFormData (for useCreateCampaign)
 */

import type { NewCampaignFormData } from "../schemas/newCampaignSchema";
import type { CampaignFormData } from "../types/campaign";
import { sanitizeSocialLinks } from "./socials";
import { parseDateInputAsLocalDate } from "@/shared/utils/dateInput";

/**
 * Transform NewCampaignFormData to CampaignFormData
 *
 * Handles:
 * - Field name mapping
 * - Date string to Date object conversion (using local timezone)
 * - Socials array normalization
 * - Categories array to comma-separated string
 * - File object for cover image (already in correct format)
 * - Lexical JSON string for campaign details (already in correct format)
 */
export function transformNewCampaignFormData(
  formData: NewCampaignFormData
): CampaignFormData {
  const socials = sanitizeSocialLinks(formData.socials);
  const policyPresetName = formData.campaignType?.trim();
  if (!policyPresetName) {
    throw new Error("Please select a campaign policy preset.");
  }

  const startDate = parseDateInputAsLocalDate(formData.startDate);
  const endDate = parseDateInputAsLocalDate(formData.endDate);

  return {
    // Basic Information
    name: formData.campaignName,
    short_description: formData.description,
    subdomain_name: formData.subdomain,
    category: formData.categories.join(","), // Join categories array to comma-separated string
    policyPresetName,

    // Fundraising Details
    funding_goal: formData.targetAmount,
    start_date: startDate ?? new Date(NaN),
    end_date: endDate ?? new Date(NaN),
    recipient_address: formData.walletAddress,

    // Rich Content
    full_description: formData.campaignDetails, // Lexical JSON string
    cover_image: formData.coverImage, // File object

    // Social Links (optional)
    socials,
  };
}
