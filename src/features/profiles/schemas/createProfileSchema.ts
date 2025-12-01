import { z } from "zod";

import { SUBDOMAIN_PATTERN } from "@/shared/utils/subdomain";
import { MAX_SOCIAL_LINKS } from "@/features/campaigns/constants/socialPlatforms";
import { socialSchema } from "@/features/campaigns/schemas/newCampaignSchema";

const imageFileSchema = z
  .instanceof(File, { message: "Please upload an image file." })
  .refine(
    (file) => file.type === "image/jpeg" || file.type === "image/png",
    "Please upload a JPEG or PNG image.",
  )
  .refine(
    (file) => file.size <= 5 * 1024 * 1024,
    "Image size must be less than 5MB.",
  );

export const createProfileSchema = z.object({
  profileImage: imageFileSchema.nullable(),
  fullName: z
    .string()
    .trim()
    .max(120, "Name must be 120 characters or less"),
  email: z
    .string()
    .trim()
    .refine(
      (value) =>
        value.length === 0 ||
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      "Please enter a valid email address",
    ),
  subdomain: z
    .string()
    .trim()
    .refine(
      (value) =>
        value.length === 0 || SUBDOMAIN_PATTERN.test(value),
      "Use lowercase letters, numbers, and interior hyphens only (no leading/trailing hyphen or dots).",
    ),
  bio: z
    .string()
    .trim()
    .max(600, "Bio must be 600 characters or less"),
  socials: z
    .array(socialSchema)
    .max(MAX_SOCIAL_LINKS, "You can add up to 5 social links."),
});

export type CreateProfileFormData = z.infer<typeof createProfileSchema>;
