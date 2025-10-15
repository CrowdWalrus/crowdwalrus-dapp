import { z } from "zod";
import { lexicalToPlainText } from "@/shared/utils/lexical";

export const campaignUpdateSchema = z.object({
  updateContent: z
    .string()
    .min(1, "Please add content for your campaign update.")
    .refine(
      (value) => lexicalToPlainText(value).length > 0,
      "Please add content for your campaign update.",
    ),
});

export type CampaignUpdateFormData = z.infer<typeof campaignUpdateSchema>;
