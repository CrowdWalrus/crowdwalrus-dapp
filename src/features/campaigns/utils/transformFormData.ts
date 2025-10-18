/**
 * Form Data Transformation Utilities
 *
 * Transforms NewCampaignFormData (from the form) to CampaignFormData (for useCreateCampaign)
 */

import type { NewCampaignFormData } from "../schemas/newCampaignSchema";
import type { CampaignFormData } from "../types/campaign";
import { sanitizeSocialLinks } from "./socials";

/**
 * Transform NewCampaignFormData to CampaignFormData
 *
 * Handles:
 * - Field name mapping
 * - Date string to Date object conversion
 * - Socials array normalization
 * - Categories array to comma-separated string
 * - File object for cover image (already in correct format)
 * - Lexical JSON string for campaign details (already in correct format)
 */
export function transformNewCampaignFormData(
  formData: NewCampaignFormData
): CampaignFormData {
  const socials = sanitizeSocialLinks(formData.socials);
  const allowedCampaignTypes = new Set(["flexible", "nonprofit", "commercial"]);
  const rawCampaignType = formData.campaignType?.trim() ?? "";
  const normalizedCampaignType = rawCampaignType.toLowerCase();
  const campaignTypeValue = allowedCampaignTypes.has(normalizedCampaignType)
    ? normalizedCampaignType
    : rawCampaignType;

  return {
    // Basic Information
    name: formData.campaignName,
    short_description: formData.description,
    subdomain_name: formData.subdomain,
    category: formData.categories.join(","), // Join categories array to comma-separated string
    campaign_type: campaignTypeValue,

    // Fundraising Details
    funding_goal: formData.targetAmount,
    start_date: new Date(formData.startDate),
    end_date: new Date(formData.endDate),
    recipient_address: formData.walletAddress,

    // Rich Content
    full_description: formData.campaignDetails, // Lexical JSON string
    cover_image: formData.coverImage, // File object

    // Social Links (optional)
    socials,
  };
}
