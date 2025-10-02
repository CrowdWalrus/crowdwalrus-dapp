/**
 * Form Data Transformation Utilities
 *
 * Transforms NewCampaignFormData (from the form) to CampaignFormData (for useCreateCampaign)
 */

import type { NewCampaignFormData } from "../schemas/newCampaignSchema";
import type { CampaignFormData } from "../types/campaign";

/**
 * Transform NewCampaignFormData to CampaignFormData
 *
 * Handles:
 * - Field name mapping
 * - Date string to Date object conversion
 * - Socials array to individual fields
 * - Categories array to comma-separated string
 * - File object for cover image (already in correct format)
 * - Lexical JSON string for campaign details (already in correct format)
 */
export function transformNewCampaignFormData(
  formData: NewCampaignFormData
): CampaignFormData {
  // Extract social links from socials array
  const twitter = formData.socials.find((s) => s.platform === "twitter")?.url || undefined;
  const discord = formData.socials.find((s) => s.platform === "discord")?.url || undefined;
  const website = formData.socials.find((s) => s.platform === "website")?.url || undefined;

  // Filter out empty strings for social links
  const social_twitter = twitter && twitter.trim() !== "" ? twitter : undefined;
  const social_discord = discord && discord.trim() !== "" ? discord : undefined;
  const social_website = website && website.trim() !== "" ? website : undefined;

  return {
    // Basic Information
    name: formData.campaignName,
    short_description: formData.description,
    subdomain_name: formData.subdomain,
    category: formData.categories.join(","), // Join categories array to comma-separated string

    // Fundraising Details
    funding_goal: formData.targetAmount,
    start_date: new Date(formData.startDate),
    end_date: new Date(formData.endDate),

    // Rich Content
    full_description: formData.campaignDetails, // Lexical JSON string
    cover_image: formData.coverImage, // File object

    // Social Links (optional)
    social_twitter,
    social_discord,
    social_website,
  };
}
