import { z } from "zod";

export const socialSchema = z.object({
  platform: z.string(),
  url: z.string().optional().or(z.literal("")),
});

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
        /^[a-z0-9-]+$/,
        "Sub-name can only contain lowercase letters, numbers, and hyphens",
      ),
    coverImage: z
      .string()
      .min(1, "Cover image is required")
      .refine((val) => val.startsWith("data:image/"), {
        message: "Invalid image format",
      }),
    campaignType: z
      .string()
      .min(1, "Please select a campaign type")
      .refine(
        (val) => ["flexible", "nonprofit", "commercial"].includes(val),
        { message: "Please select a valid campaign type" },
      ),
    categories: z
      .array(z.string())
      .min(1, "Please select at least one category"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    targetAmount: z
      .string()
      .min(1, "Target amount is required")
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Target amount must be a positive number",
      }),
    walletAddress: z
      .string()
      .min(1, "Wallet address is required")
      .regex(/^0x[a-fA-F0-9]+$/, "Please enter a valid Sui wallet address"),
    socials: z.array(socialSchema),
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
    termsAccepted: z
      .boolean()
      .refine((val) => val === true, {
        message: "You must accept the terms and conditions",
      }),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export type NewCampaignFormData = z.infer<typeof newCampaignSchema>;
