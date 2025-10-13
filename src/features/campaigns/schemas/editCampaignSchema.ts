import { z } from "zod";

import { newCampaignSchema } from "./newCampaignSchema";

/**
 * Build a schema for editing campaigns.
 * Reuses the creation schema while omitting immutable fields.
 */
export const buildEditCampaignSchema = () =>
  newCampaignSchema
    .omit({
      termsAccepted: true,
      coverImage: true,
      startDate: true,
      endDate: true,
      targetAmount: true,
      subdomain: true,
      walletAddress: true,
    })
    .extend({
      coverImage: z.instanceof(File).optional(),
      campaignDetails: z
        .string()
        .optional()
        .refine(
          (val) => {
            if (!val || val === "") {
              return true;
            }
            try {
              JSON.parse(val);
              return true;
            } catch {
              return false;
            }
          },
          {
            message: "Invalid campaign details format (must be valid JSON)",
          },
        ),
      storageEpochs: z
        .number()
        .int()
        .min(1, "Storage epochs must be at least 1")
        .optional(),
    });

export type EditCampaignFormData = z.infer<
  ReturnType<typeof buildEditCampaignSchema>
>;
