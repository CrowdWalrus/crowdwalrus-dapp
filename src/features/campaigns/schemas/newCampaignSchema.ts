import { z } from "zod";
import { isValidSuiAddress } from "@mysten/sui/utils";

import {
  FUNDING_TARGET_DISPLAY_LOCALE,
  MAX_FUNDING_TARGET,
  MIN_FUNDING_TARGET,
} from "@/features/campaigns/constants/funding";
import { MAX_SOCIAL_LINKS } from "@/features/campaigns/constants/socialPlatforms";
import { SUBDOMAIN_PATTERN } from "@/shared/utils/subdomain";

const isValidHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

export const socialSchema = z.object({
  platform: z.string(),
  url: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || !/\s/.test(value),
      "URL cannot contain spaces",
    )
    .refine(
      (value) => value === "" || isValidHttpUrl(value),
      "Please enter a valid URL",
    ),
});

const MIN_FUNDING_TARGET_LABEL = MIN_FUNDING_TARGET.toLocaleString(
  FUNDING_TARGET_DISPLAY_LOCALE,
);
const MAX_FUNDING_TARGET_LABEL = MAX_FUNDING_TARGET.toLocaleString(
  FUNDING_TARGET_DISPLAY_LOCALE,
);

export const newCampaignSchema = z
  .object({
    campaignName: z
      .string()
      .min(1, "Campaign name is required")
      .min(3, "Campaign name must be at least 3 characters"),
    description: z
      .string()
      .min(1, "Description is required")
      .min(10, "Description must be at least 10 characters"),
    subdomain: z
      .string()
      .min(1, "Sub-name is required")
      .regex(
        SUBDOMAIN_PATTERN,
        "Use lowercase letters, numbers, and interior hyphens only (no leading/trailing hyphen or dots).",
      ),
    coverImage: z
      .instanceof(File, { message: "Cover image is required" })
      .refine((file) => file.type.startsWith("image/"), {
        message: "Invalid image format",
      })
      .refine((file) => file.size <= 5 * 1024 * 1024, {
        message: "Image size must be less than 5MB",
      }),
    campaignType: z
      .string()
      .min(1, "Please select a campaign type")
      .refine((val) => ["flexible", "nonprofit", "commercial"].includes(val), {
        message: "Please select a valid campaign type",
      }),
    categories: z
      .array(z.string())
      .min(1, "Please select at least one category"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    targetAmount: z
      .string()
      .min(1, "Target amount is required")
      .regex(/^\d+$/, {
        message: "Target amount must be a whole dollar amount",
      })
      .superRefine((val, ctx) => {
        const numericValue = Number(val);

        if (numericValue < MIN_FUNDING_TARGET) {
          ctx.addIssue({
            code: "custom",
            message: `Target amount must be at least $${MIN_FUNDING_TARGET_LABEL}`,
          });
        }

        if (numericValue > MAX_FUNDING_TARGET) {
          ctx.addIssue({
            code: "custom",
            message: `Target amount cannot exceed $${MAX_FUNDING_TARGET_LABEL}`,
          });
        }
      }),
    walletAddress: z
      .string()
      .min(1, "Wallet address is required")
      .refine(
        (value) => !/\s/.test(value),
        "Wallet address cannot contain spaces",
      )
      .refine(
        (value) => isValidSuiAddress(value),
        "Please enter a valid Sui wallet address",
      ),
    socials: z
      .array(socialSchema)
      .max(MAX_SOCIAL_LINKS, "You can add up to 5 social links."),
    campaignDetails: z
      .string()
      .min(1, "Campaign details are required")
      .refine(
        (val) => {
          try {
            JSON.parse(val);
            return true;
          } catch {
            return false;
          }
        },
        { message: "Invalid campaign details format" },
      ),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export type NewCampaignFormData = z.infer<typeof newCampaignSchema>;
