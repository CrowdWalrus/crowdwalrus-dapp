/**
 * Hook to fetch all campaigns from the blockchain
 *
 * This hook:
 * 1. Queries the CrowdWalrus object to get all campaign IDs
 * 2. Fetches campaign objects from Sui blockchain
 * 3. Extracts Walrus blob ID from campaign metadata
 * 4. Fetches cover images and descriptions from Walrus storage
 * 5. Returns structured campaign data
 */

import { useMemo } from "react";
import { useSuiClientQuery } from "@mysten/dapp-kit";
import type { CampaignSocialLink } from "@/features/campaigns/types/campaign";
import { parseSocialLinksFromMetadata } from "@/features/campaigns/utils/socials";
import { getContractConfig } from "@/shared/config/contracts";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import { getWalrusUrl } from "@/services/walrus";
import {
  parseOptionalTimestampFromMove,
  parseTimestampFromMove,
  parseU64FromMove,
} from "@/shared/utils/onchainParsing";

export interface CampaignData {
  // Sui blockchain data
  id: string;
  adminId: string;
  name: string;
  shortDescription: string;
  subdomainName: string;
  recipientAddress: string;
  startDateMs: number;
  endDateMs: number;
  createdAtMs: number;
  isVerified: boolean;
  isActive: boolean;
  isDeleted: boolean;
  deletedAtMs: number | null;
  nextUpdateSeq: number;

  // Metadata fields
  fundingGoal: string;
  category: string;
  walrusQuiltId: string;
  walrusStorageEpochs: string;
  coverImageId: string;
  campaignType?: string;
  socialLinks: CampaignSocialLink[];

  // Walrus URLs
  coverImageUrl: string;
  descriptionUrl: string;
}

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

const extractCampaignIdFromEvent = (event: unknown): string | null => {
  if (!event || typeof event !== "object") {
    return null;
  }

  const parsedJson = (event as { parsedJson?: { campaign_id?: unknown } }).parsedJson;
  const campaignId = parsedJson?.campaign_id;
  return typeof campaignId === "string" ? campaignId : null;
};

export function useMyCampaigns(
  network: "devnet" | "testnet" | "mainnet" = DEFAULT_NETWORK,
) {
  const config = getContractConfig(network);

  // Step 1: Query CampaignCreated events to get all campaign IDs
  const {
    data: eventsData,
    isPending: isEventsPending,
    error: eventsError,
    refetch: refetchEvents,
  } = useSuiClientQuery("queryEvents", {
    query: {
      MoveEventType: `${config.contracts.packageId}::crowd_walrus::CampaignCreated`,
    },
    limit: 50,
    order: "descending",
  });

  // Extract campaign IDs from events
  const campaignIds = useMemo(() => {
    if (!eventsData?.data) return [];

    const ids = eventsData.data
      .map((event) => extractCampaignIdFromEvent(event))
      .filter((id): id is string => Boolean(id));

    console.log("Campaign IDs from events:", ids);
    return ids;
  }, [eventsData]);

  // Step 2: Fetch campaign objects (only when we have IDs)
  const {
    data: campaignObjects,
    isPending: isCampaignsPending,
    error: campaignsError,
    refetch: refetchCampaigns,
  } = useSuiClientQuery(
    "multiGetObjects",
    {
      ids: campaignIds,
      options: {
        showContent: true,
        showType: true,
      },
    },
    {
      enabled: campaignIds.length > 0,
    }
  );

  // Step 3: Process campaign data
  const campaigns = useMemo(() => {
    if (!campaignObjects) return [];

    console.log("Fetched campaign objects:", campaignObjects);

    const processedCampaigns = campaignObjects
      .map((obj) => {
        try {
          const content = obj.data?.content;
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
            id: fields.id?.id || obj.data?.objectId || "",
            adminId: fields.admin_id ?? "",
            name: fields.name ?? "",
            shortDescription: fields.short_description ?? "",
            subdomainName: fields.subdomain_name ?? "",
            recipientAddress:
              fields.recipient_address ??
              metadataMap["recipient_address"] ??
              "",
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
      })
      .filter((campaign): campaign is CampaignData => campaign !== null)
      .sort((a, b) => b.createdAtMs - a.createdAtMs);

    return processedCampaigns;
  }, [campaignObjects, network]);

  // Combine loading and error states
  const isPending = isEventsPending || isCampaignsPending;
  const error = eventsError || campaignsError;

  // Refetch both queries
  const refetch = () => {
    refetchEvents();
    if (campaignIds.length > 0) {
      refetchCampaigns();
    }
  };

  return {
    campaigns,
    isPending,
    error: error || null,
    refetch,
    hasNoCampaigns: !isPending && campaigns.length === 0,
  };
}

/**
 * Hook to fetch campaign description from Walrus
 */
export function useCampaignDescription(descriptionUrl: string) {
  const fetchDescription = async () => {
    if (!descriptionUrl) return '';

    try {
      const response = await fetch(descriptionUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch description: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error fetching campaign description:', error);
      return '';
    }
  };

  return fetchDescription;
}
