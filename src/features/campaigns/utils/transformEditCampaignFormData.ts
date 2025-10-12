import type { FieldNamesMarkedBoolean } from "react-hook-form";

import type { EditCampaignFormData } from "../schemas/editCampaignSchema";
import type { CampaignData } from "../hooks/useMyCampaigns";
import type { MetadataPatch } from "../types/campaign";

export interface TransformEditCampaignParams {
  values: EditCampaignFormData;
  dirtyFields: FieldNamesMarkedBoolean<EditCampaignFormData>;
  campaign: CampaignData;
  initialDescription?: string;
}

export interface TransformEditCampaignResult {
  basicsUpdates: {
    name?: string;
    short_description?: string;
  };
  metadataPatch: MetadataPatch;
  shouldUploadWalrus: boolean;
  coverImageChanged: boolean;
  descriptionChanged: boolean;
  storageEpochsChanged: boolean;
  nextStorageEpochs?: number;
  hasBasicsChanges: boolean;
  hasMetadataChanges: boolean;
}

const normalize = (value: string | undefined | null) =>
  (value ?? "").trim();

const normalizeDescription = (value: string | undefined | null) =>
  value ?? "";

const pickSocialValue = (
  socials: EditCampaignFormData["socials"],
  platform: string,
) => {
  const entry = socials.find((social) => social.platform === platform);
  return entry?.url?.trim() ?? "";
};

const isFieldDirty = <Key extends keyof EditCampaignFormData>(
  dirtyFields: FieldNamesMarkedBoolean<EditCampaignFormData>,
  key: Key,
) => {
  const value = dirtyFields[key];
  if (Array.isArray(value)) {
    return value.some(Boolean);
  }
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some(Boolean);
  }
  return Boolean(value);
};

/**
 * Transform edit form values into contract-friendly payloads.
 */
export function transformEditCampaignFormData({
  values,
  dirtyFields,
  campaign,
  initialDescription,
}: TransformEditCampaignParams): TransformEditCampaignResult {
  const basicsUpdates: Record<string, string> = {};

  const nextName = values.campaignName.trim();
  if (
    (isFieldDirty(dirtyFields, "campaignName") ||
      normalize(campaign.name) !== nextName) &&
    nextName !== normalize(campaign.name)
  ) {
    basicsUpdates.name = nextName;
  }

  const nextDescription = values.description.trim();
  if (
    (isFieldDirty(dirtyFields, "description") ||
      normalize(campaign.shortDescription) !== nextDescription) &&
    nextDescription !== normalize(campaign.shortDescription)
  ) {
    basicsUpdates.short_description = nextDescription;
  }

  const metadataPatch: MetadataPatch = {};

  const nextCampaignType = values.campaignType?.trim() ?? "";
  const previousCampaignType = campaign.campaignType?.trim() ?? "";
  if (
    (isFieldDirty(dirtyFields, "campaignType") ||
      nextCampaignType !== previousCampaignType) &&
    nextCampaignType !== previousCampaignType
  ) {
    metadataPatch.campaign_type = nextCampaignType;
  }

  const nextCategory = values.categories.join(",").trim();
  const previousCategory = campaign.category?.trim() ?? "";
  if (
    (isFieldDirty(dirtyFields, "categories") ||
      nextCategory !== previousCategory) &&
    nextCategory !== previousCategory
  ) {
    metadataPatch.category = nextCategory;
  }

  const nextTwitter = pickSocialValue(values.socials, "twitter");
  const previousTwitter = campaign.socialTwitter?.trim() ?? "";
  if (nextTwitter !== previousTwitter) {
    metadataPatch.social_twitter = nextTwitter;
  }

  const nextDiscord = pickSocialValue(values.socials, "discord");
  const previousDiscord = campaign.socialDiscord?.trim() ?? "";
  if (nextDiscord !== previousDiscord) {
    metadataPatch.social_discord = nextDiscord;
  }

  const nextWebsite = pickSocialValue(values.socials, "website");
  const previousWebsite = campaign.socialWebsite?.trim() ?? "";
  if (nextWebsite !== previousWebsite) {
    metadataPatch.social_website = nextWebsite;
  }

  const coverImageChanged = Boolean(values.coverImage);
  const previousStorageEpochs = campaign.walrusStorageEpochs
    ? Number.parseInt(campaign.walrusStorageEpochs, 10)
    : undefined;
  const storageEpochsChanged =
    typeof values.storageEpochs === "number" &&
    values.storageEpochs > 0 &&
    values.storageEpochs !== previousStorageEpochs;
  const descriptionChanged =
    normalizeDescription(values.campaignDetails) !==
    normalizeDescription(initialDescription);

  const shouldUploadWalrus =
    coverImageChanged || descriptionChanged || storageEpochsChanged;

  return {
    basicsUpdates,
    metadataPatch,
    shouldUploadWalrus,
    coverImageChanged,
    descriptionChanged,
    storageEpochsChanged,
    nextStorageEpochs: values.storageEpochs,
    hasBasicsChanges: Object.keys(basicsUpdates).length > 0,
    hasMetadataChanges: Object.keys(metadataPatch).length > 0,
  };
}
