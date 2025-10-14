import { z } from "zod";

export const campaignUpdateSchema = z.object({
  updateContent: z
    .string()
    .min(1, "Please add content for your campaign update."),
});

export type CampaignUpdateFormData = z.infer<typeof campaignUpdateSchema>;
