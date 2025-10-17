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
import type { CampaignData } from "./useMyCampaigns";
import {
  parseOptionalTimestampFromMove,
  parseTimestampFromMove,
  parseU64FromMove,
} from "@/shared/utils/onchainParsing";

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
  campaign_type?: unknown;
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

const normalizeCampaignType = (value: string | undefined): string => {
  if (!value) {
    return "";
  }
  const canonical = value.toLowerCase().replace(/[\s_-]/g, "");
  if (canonical === "nonprofit") {
    return "nonprofit";
  }
  if (canonical === "commercial") {
    return "commercial";
  }
  if (canonical === "flexible") {
    return "flexible";
  }
  return value;
};

export function useCampaign(
  campaignId: string,
  network: SupportedNetwork = DEFAULT_NETWORK,
) {
  // Fetch single campaign object
  const {
    data: campaignObject,
    isPending,
    error,
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

      console.log(`Campaign "${fields.name}" metadata:`, metadataMap);
      console.log(`Walrus Quilt ID:`, walrusQuiltId);

      const socialLinks = parseSocialLinksFromMetadata(metadataMap);

      const rawCampaignType = normalizeCampaignType(
        metadataMap["campaign_type"] ??
          extractMoveString(fields.campaign_type) ??
          "",
      );

      const campaignData: CampaignData = {
        id: fields.id?.id || campaignObject.data.objectId || "",
        adminId: fields.admin_id ?? "",
        name: fields.name ?? "",
        shortDescription: fields.short_description ?? "",
        subdomainName: fields.subdomain_name ?? "",
        recipientAddress:
          fields.recipient_address ?? metadataMap["recipient_address"] ?? "",
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
        fundingGoal: metadataMap["funding_goal"] || "0",
        category: metadataMap["category"] || "Other",
        walrusQuiltId,
        walrusStorageEpochs: metadataMap["walrus_storage_epochs"] || "0",
        coverImageId: metadataMap["cover_image_id"] || "cover.jpg",
        campaignType: rawCampaignType,
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

      console.log("Generated URLs:", {
        coverImageUrl: campaignData.coverImageUrl,
        descriptionUrl: campaignData.descriptionUrl,
      });

      return campaignData;
    } catch (err) {
      console.error("Error parsing campaign object:", err);
      return null;
    }
  }, [campaignObject, network]);

  return {
    campaign,
    isPending,
    error: error || null,
    refetch,
  };
}
