/**
 * Form Data Transformation Utilities
 *
 * Transforms NewCampaignFormData (from the form) to CampaignFormData (for useCreateCampaign)
 */

import type { NewCampaignFormData } from "../schemas/newCampaignSchema";
import type { CampaignFormData } from "../types/campaign";
import { sanitizeSocialLinks } from "./socials";

/**
 * Parse a date string (YYYY-MM-DD) as midnight in the user's local timezone
 *
 * This ensures that when a user selects "November 1st", the campaign starts
 * at midnight on November 1st in THEIR timezone, not UTC midnight.
 *
 * @param dateString - Date string in YYYY-MM-DD format (or undefined/empty)
 * @returns Date object representing midnight in local timezone, or Invalid Date if input is invalid
 *
 * @example
 * // User in PST (UTC-8) selects "2025-11-01"
 * parseLocalDate("2025-11-01")
 * // Returns: 2025-11-01T08:00:00.000Z (which is midnight PST in UTC)
 *
 * @example
 * // User in JST (UTC+9) selects "2025-11-01"
 * parseLocalDate("2025-11-01")
 * // Returns: 2025-10-31T15:00:00.000Z (which is midnight JST in UTC)
 *
 * @example
 * // Missing or invalid dates return Invalid Date (safe for auto-estimation)
 * parseLocalDate(undefined) // Returns: Invalid Date
 * parseLocalDate("")        // Returns: Invalid Date
 */
function parseLocalDate(dateString: string | undefined): Date {
  // Handle missing or empty dates gracefully
  // This can happen during auto-estimation before user selects dates
  if (!dateString || dateString.trim().length === 0) {
    return new Date(NaN); // Invalid Date (matches old behavior)
  }

  const [year, month, day] = dateString.split("-").map(Number);

  // Validate that we got valid numbers
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return new Date(NaN); // Invalid Date
  }

  // Month is 0-indexed in JavaScript Date constructor
  // This creates a date at midnight in the user's local timezone
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

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

  return {
    // Basic Information
    name: formData.campaignName,
    short_description: formData.description,
    subdomain_name: formData.subdomain,
    category: formData.categories.join(","), // Join categories array to comma-separated string
    policyPresetName,

    // Fundraising Details
    funding_goal: formData.targetAmount,
    start_date: parseLocalDate(formData.startDate),
    end_date: parseLocalDate(formData.endDate),
    recipient_address: formData.walletAddress,

    // Rich Content
    full_description: formData.campaignDetails, // Lexical JSON string
    cover_image: formData.coverImage, // File object

    // Social Links (optional)
    socials,
  };
}
