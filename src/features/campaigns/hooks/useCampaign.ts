/**
 * Hook to fetch a single campaign by ID from the blockchain
 *
 * This hook:
 * 1. Fetches a specific campaign object from Sui blockchain by ID
 * 2. Extracts Walrus blob ID from campaign metadata
 * 3. Generates Walrus URLs for cover image and description
 * 4. Returns structured campaign data
 */

import { useMemo } from "react";
import { useSuiClientQuery } from "@mysten/dapp-kit";
import { parseSocialLinksFromMetadata } from "@/features/campaigns/utils/socials";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";
import { getWalrusUrl } from "@/services/walrus";
import type { CampaignData } from "./useAllCampaigns";
import { useCampaignCreator } from "./useCampaignCreator";
import {
  parseOptionalTimestampFromMove,
  parseTimestampFromMove,
  parseU64FromMove,
  parseU64BigIntFromMove,
} from "@/shared/utils/onchainParsing";
import { formatUsdFromMicros } from "@/shared/utils/currency";
import { inferPolicyPresetFromBps } from "@/features/campaigns/constants/policies";

interface MetadataField {
  fields?: {
    key?: string;
    value?: string;
  };
}

interface CampaignMoveContentFields {
  id?: { id?: string };
  admin_id?: string;
  name?: string;
  short_description?: string;
  subdomain_name?: string;
  recipient_address?: string;
  start_date?: unknown;
  end_date?: unknown;
  created_at_ms?: unknown;
  created_at?: unknown;
  is_verified?: boolean;
  validated?: boolean;
  is_active?: boolean;
  isActive?: boolean;
  is_deleted?: boolean;
  isDeleted?: boolean;
  deleted_at_ms?: unknown;
  next_update_seq?: unknown;
  nextUpdateSeq?: unknown;
  funding_goal_usd_micro?: unknown;
  payout_policy?: {
    fields?: {
      platform_bps?: unknown;
      platform_address?: string;
      recipient_address?: string;
    };
  };
  metadata?: {
    fields?: {
      contents?: MetadataField[];
    };
  };
}

const extractMoveString = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const candidate = value as {
      fields?: { contents?: unknown };
      value?: unknown;
    };

    if (typeof candidate.value === "string") {
      return candidate.value.trim();
    }

    const contents = candidate.fields?.contents;
    if (typeof contents === "string") {
      return contents.trim();
    }
  }

  return undefined;
};

const extractPayoutPolicyFields = (
  payoutPolicy: CampaignMoveContentFields["payout_policy"],
) => {
  const policyFields = payoutPolicy?.fields;
  const hasBps = policyFields?.platform_bps !== undefined;
  const platformBps = hasBps
    ? parseU64FromMove(policyFields?.platform_bps ?? 0, 0)
    : undefined;
  const platformAddress =
    typeof policyFields?.platform_address === "string"
      ? policyFields.platform_address
      : undefined;
  const recipientAddress =
    typeof policyFields?.recipient_address === "string"
      ? policyFields.recipient_address
      : undefined;

  return { platformBps, platformAddress, recipientAddress };
};

const parseFundingGoalUsdMicro = (
  fields: CampaignMoveContentFields,
): bigint => {
  return parseU64BigIntFromMove(fields.funding_goal_usd_micro, 0n);
};

export function useCampaign(
  campaignId: string,
  network: SupportedNetwork = DEFAULT_NETWORK,
) {
  // Fetch single campaign object
  const {
    data: campaignObject,
    isPending: isCampaignPending,
    error: campaignError,
    refetch,
  } = useSuiClientQuery(
    "getObject",
    {
      id: campaignId,
      options: {
        showContent: true,
        showType: true,
      },
    },
    {
      enabled: !!campaignId,
    },
  );

  // Get creator address from CampaignCreated event
  const {
    creatorAddress,
    isLoading: isCreatorLoading,
    error: creatorError,
  } = useCampaignCreator(campaignId, network);

  // Process campaign data
  const campaign = useMemo(() => {
    if (!campaignObject?.data) return null;

    try {
      const content = campaignObject.data.content;
      if (!content || content.dataType !== "moveObject") return null;

      const fields = content.fields as CampaignMoveContentFields;
      const metadata = fields.metadata?.fields?.contents || [];
      const metadataMap: Record<string, string> = {};

      metadata.forEach((item) => {
        const key = extractMoveString(item.fields?.key);
        const value = extractMoveString(item.fields?.value);
        if (key && typeof value === "string") {
          metadataMap[key] = value;
        }
      });

      const walrusQuiltId = metadataMap["walrus_quilt_id"] || "";

      const socialLinks = parseSocialLinksFromMetadata(metadataMap);
      const payoutPolicy = extractPayoutPolicyFields(fields.payout_policy);
      const fundingGoalUsdMicro = parseFundingGoalUsdMicro(fields);
      const fundingGoalDisplay = formatUsdFromMicros(fundingGoalUsdMicro);

      const policyPresetName = inferPolicyPresetFromBps(
        payoutPolicy.platformBps,
      );

      const campaignData: CampaignData = {
        id: fields.id?.id || campaignObject.data.objectId || "",
        adminId: fields.admin_id ?? "",
        creatorAddress: creatorAddress ?? "",
        name: fields.name ?? "",
        shortDescription: fields.short_description ?? "",
        subdomainName: fields.subdomain_name ?? "",
        recipientAddress: payoutPolicy.recipientAddress ?? "",
        startDateMs: parseTimestampFromMove(fields.start_date),
        endDateMs: parseTimestampFromMove(fields.end_date),
        createdAtMs: parseTimestampFromMove(
          fields.created_at_ms ?? fields.created_at,
        ),
        isVerified:
          fields.is_verified !== undefined
            ? Boolean(fields.is_verified)
            : Boolean(fields.validated),
        isActive: Boolean(fields.is_active ?? fields.isActive),
        isDeleted: Boolean(fields.is_deleted ?? fields.isDeleted),
        deletedAtMs: parseOptionalTimestampFromMove(fields.deleted_at_ms),
        nextUpdateSeq: parseU64FromMove(
          fields.next_update_seq ?? fields.nextUpdateSeq ?? 0,
        ),
        fundingGoal: fundingGoalDisplay,
        fundingGoalUsdMicro,
        category: metadataMap["category"] || "Other",
        walrusQuiltId,
        walrusStorageEpochs: metadataMap["walrus_storage_epochs"] || "0",
        coverImageId: metadataMap["cover_image_id"] || "cover.jpg",
        policyPresetName,
        payoutPlatformBps: payoutPolicy.platformBps,
        payoutPlatformAddress: payoutPolicy.platformAddress,
        socialLinks,
        coverImageUrl: walrusQuiltId
          ? getWalrusUrl(
              walrusQuiltId,
              network,
              metadataMap["cover_image_id"] || "cover.jpg",
            )
          : "",
        descriptionUrl: walrusQuiltId
          ? getWalrusUrl(walrusQuiltId, network, "description.json")
          : "",
      };

      return campaignData;
    } catch (err) {
      console.error("Error parsing campaign object:", err);
      return null;
    }
  }, [campaignObject, network, creatorAddress]);

  const isPending = isCampaignPending || isCreatorLoading;
  const error = campaignError || creatorError;

  return {
    campaign,
    isPending,
    error: error || null,
    refetch,
  };
}
