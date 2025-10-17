/**
 * Hook to fetch the creator address of a campaign from CampaignCreated events
 *
 * This hook queries the blockchain for CampaignCreated events and extracts
 * the creator address (the owner of CampaignOwnerCap) for a specific campaign.
 */

import { useMemo } from "react";
import { useSuiClientQuery } from "@mysten/dapp-kit";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import { getContractConfig } from "@/shared/config/contracts";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";

interface UseCampaignCreatorResult {
  creatorAddress: string | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Extract creator address from a CampaignCreated event for a specific campaign ID
 * Normalizes both campaign IDs before comparison to handle different ID formats
 */
function extractCreatorFromEvents(
  eventsData: unknown,
  targetCampaignId: string,
): string | null {
  if (!eventsData || typeof eventsData !== "object") return null;

  const events = (eventsData as { data?: unknown[] }).data;
  if (!Array.isArray(events)) return null;

  // Normalize the target campaign ID for comparison
  const normalizedTargetId = normalizeSuiAddress(targetCampaignId);

  for (const event of events) {
    if (!event || typeof event !== "object") continue;

    const parsedJson = (
      event as { parsedJson?: { campaign_id?: unknown; creator?: unknown } }
    ).parsedJson;

    if (
      typeof parsedJson?.campaign_id === "string" &&
      typeof parsedJson.creator === "string"
    ) {
      // Normalize the event's campaign ID before comparison
      const normalizedEventId = normalizeSuiAddress(parsedJson.campaign_id);

      if (normalizedEventId === normalizedTargetId) {
        return parsedJson.creator;
      }
    }
  }

  return null;
}

/**
 * Hook to get the creator address for a specific campaign
 *
 * @param campaignId - The ID of the campaign to look up
 * @param network - The Sui network to query (defaults to DEFAULT_NETWORK)
 * @returns Object containing creator address, loading state, error, and refetch function
 */
export function useCampaignCreator(
  campaignId: string | null | undefined,
  network: SupportedNetwork = DEFAULT_NETWORK,
): UseCampaignCreatorResult {
  const config = getContractConfig(network);
  const normalizedCampaignId = campaignId ?? null;

  // Query for CampaignCreated events
  const {
    data: eventsData,
    isPending,
    error,
    refetch,
  } = useSuiClientQuery(
    "queryEvents",
    {
      query: {
        MoveEventType: `${config.contracts.packageId}::crowd_walrus::CampaignCreated`,
      },
      limit: 100, // Increased from 50 to support more campaigns
      order: "descending",
    },
    {
      enabled: Boolean(normalizedCampaignId),
    },
  );

  // Extract creator address from events
  const creatorAddress = useMemo(() => {
    if (!normalizedCampaignId) return null;
    return extractCreatorFromEvents(eventsData, normalizedCampaignId);
  }, [eventsData, normalizedCampaignId]);

  return {
    creatorAddress,
    isLoading: isPending,
    error: error instanceof Error ? error : null,
    refetch,
  };
}

/**
 * Shared utility to extract all campaign creators from CampaignCreated events
 * Used by useAllCampaigns to build a map of campaign_id -> creator
 * Normalizes campaign IDs to ensure consistent matching
 */
export interface CampaignCreatedEventData {
  campaign_id: string;
  creator: string;
}

export function extractCampaignDataFromEvent(
  event: unknown,
): CampaignCreatedEventData | null {
  if (!event || typeof event !== "object") {
    return null;
  }

  const parsedJson = (
    event as { parsedJson?: { campaign_id?: unknown; creator?: unknown } }
  ).parsedJson;
  const campaignId = parsedJson?.campaign_id;
  const creator = parsedJson?.creator;

  if (typeof campaignId === "string" && typeof creator === "string") {
    // Normalize campaign ID to ensure consistent matching across different ID formats
    return {
      campaign_id: normalizeSuiAddress(campaignId),
      creator,
    };
  }

  return null;
}
