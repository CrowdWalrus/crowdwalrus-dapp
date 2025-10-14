import { useEffect, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSuiClient } from "@mysten/dapp-kit";
import type { EventId, PaginatedEvents, SuiEvent } from "@mysten/sui/client";

import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import { getContractConfig } from "@/shared/config/contracts";
import { getWalrusUrl } from "@/services/walrus";
import type { CampaignUpdate } from "@/features/campaigns/types/campaignUpdate";

interface UseCampaignUpdatesResult {
  updates: CampaignUpdate[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

function normalizeToString(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return value.toString();
  }

  return undefined;
}

function parseMetadata(payload: unknown): Record<string, string> {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const metadata: Record<string, string> = {};
  const root = payload as Record<string, unknown>;

  const candidateArrays: unknown[] = [];

  if (Array.isArray(root.contents)) {
    candidateArrays.push(root.contents);
  }

  const fields = root.fields as Record<string, unknown> | undefined;
  if (fields) {
    if (Array.isArray(fields.contents)) {
      candidateArrays.push(fields.contents);
    } else if (
      Array.isArray(fields.keys) &&
      Array.isArray(fields.values) &&
      fields.keys.length === fields.values.length
    ) {
      candidateArrays.push(
        fields.keys.map((key, index) => ({
          key,
          value: (fields.values as unknown[])[index],
        })),
      );
    }
  }

  if (candidateArrays.length === 0) {
    if (
      Array.isArray(root.keys) &&
      Array.isArray(root.values) &&
      root.keys.length === root.values.length
    ) {
      candidateArrays.push(
        root.keys.map((key, index) => ({
          key,
          value: (root.values as unknown[])[index],
        })),
      );
    }
  }

  candidateArrays.forEach((entries) => {
    if (!Array.isArray(entries)) {
      return;
    }

    entries.forEach((entryRaw) => {
      if (!entryRaw || typeof entryRaw !== "object") {
        return;
      }

      const entry = entryRaw as Record<string, unknown>;
      const entryFields = entry.fields as Record<string, unknown> | undefined;

      const keySource =
        entryFields?.key ?? entryFields?.name ?? entry.key ?? entry.name;
      const valueSource =
        entryFields?.value ?? entryFields?.data ?? entry.value ?? entry.data;

      const normalizedKey = normalizeToString(keySource);
      const normalizedValue = normalizeToString(valueSource);

      if (normalizedKey && normalizedValue !== undefined) {
        metadata[normalizedKey] = normalizedValue;
      }
    });
  });

  return metadata;
}

const PAGE_SIZE = 50;
const MAX_AUTO_PAGES = 10;

export function useCampaignUpdates(
  campaignId: string | null | undefined,
  network: "devnet" | "testnet" | "mainnet" = DEFAULT_NETWORK,
  limit = 50,
): UseCampaignUpdatesResult {
  const enabled = Boolean(campaignId);
  const config = getContractConfig(network);
  const eventType = `${config.contracts.packageId}::campaign::CampaignUpdateAdded`;

  const suiClient = useSuiClient();
  const normalizedCampaignId = useMemo(
    () => (campaignId ? campaignId.toLowerCase() : null),
    [campaignId],
  );

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<PaginatedEvents, Error>({
    queryKey: ["campaign-updates", network, normalizedCampaignId, limit],
    queryFn: ({ pageParam }) => {
      if (!campaignId) {
        return Promise.resolve({
          data: [],
          hasNextPage: false,
          nextCursor: null,
        } satisfies PaginatedEvents);
      }

      const pageLimit = Math.max(1, Math.min(limit, PAGE_SIZE));
      const cursor = (pageParam as EventId | null | undefined) ?? null;

      return suiClient.queryEvents({
        query: {
          MoveEventType: eventType,
        },
        order: "descending",
        cursor,
        limit: pageLimit,
      });
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.nextCursor : undefined,
    initialPageParam: null,
    enabled,
  });

  const { updates, totalMatching } = useMemo(() => {
    if (!enabled || !data?.pages?.length || !campaignId) {
      return { updates: [], totalMatching: 0 };
    }

    const events = data.pages.flatMap((page) => page.data as SuiEvent[]);
    const normalizedTargetId = normalizedCampaignId;

    const parsedUpdates: CampaignUpdate[] = [];

    events.forEach((event) => {
      const parsedJson = event.parsedJson as
        | Record<string, unknown>
        | undefined;
      if (!parsedJson) {
        return;
      }

      const eventCampaignId = normalizeToString(parsedJson.campaign_id);
      if (!eventCampaignId) {
        return;
      }

      const normalizedEventCampaignId = eventCampaignId.toLowerCase();

      if (
        !normalizedTargetId ||
        normalizedEventCampaignId !== normalizedTargetId
      ) {
        return;
      }

      const metadata = parseMetadata(parsedJson.metadata);
      const walrusBlobIdRaw =
        metadata["walrus_blob_id"] ?? metadata["walrusQuiltId"] ?? undefined;
      const walrusContentPath =
        metadata["walrus_content_path"] ??
        metadata["walrusContentPath"] ??
        "update.json";
      const walrusContentUrl =
        walrusBlobIdRaw && walrusContentPath
          ? getWalrusUrl(walrusBlobIdRaw, network, walrusContentPath)
          : undefined;

      const createdAtRaw = normalizeToString(parsedJson.created_at_ms);
      const sequenceRaw = normalizeToString(parsedJson.sequence);
      const updateId = normalizeToString(parsedJson.update_id);
      const author = normalizeToString(parsedJson.author);
      const summary =
        metadata["summary"] ??
        metadata["plain_text_summary"] ??
        metadata["description"] ??
        undefined;

      if (!updateId) {
        return;
      }

      const createdAtMs = Number(createdAtRaw ?? "0");
      const sequence = Number(sequenceRaw ?? "0");

      parsedUpdates.push({
        updateId,
        sequence: Number.isFinite(sequence) ? sequence : 0,
        createdAtMs: Number.isFinite(createdAtMs) ? createdAtMs : 0,
        author,
        metadata,
        walrusBlobId: walrusBlobIdRaw ?? "",
        walrusContentPath,
        walrusContentUrl,
        summary,
      });
    });

    parsedUpdates.sort((first, second) => second.sequence - first.sequence);
    return {
      updates: parsedUpdates.slice(0, limit),
      totalMatching: parsedUpdates.length,
    };
  }, [campaignId, data?.pages, enabled, limit, network, normalizedCampaignId]);

  useEffect(() => {
    if (!enabled || !hasNextPage || isFetchingNextPage || isLoading) {
      return;
    }

    const pagesFetched = data?.pages?.length ?? 0;
    if (pagesFetched >= MAX_AUTO_PAGES) {
      return;
    }

    if (totalMatching < limit) {
      fetchNextPage();
    }
  }, [
    data?.pages,
    enabled,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    limit,
    totalMatching,
  ]);

  const handleRefetch = () => {
    void refetch();
  };

  return {
    updates,
    isLoading,
    error: (error as Error) ?? null,
    refetch: handleRefetch,
  };
}
