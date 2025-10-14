import { useMemo } from "react";
import { useSuiClientQuery } from "@mysten/dapp-kit";
import type { SuiEvent } from "@mysten/sui/client";

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
        entryFields?.key ??
        entryFields?.name ??
        entry.key ??
        entry.name;
      const valueSource =
        entryFields?.value ??
        entryFields?.data ??
        entry.value ??
        entry.data;

      const normalizedKey = normalizeToString(keySource);
      const normalizedValue = normalizeToString(valueSource);

      if (normalizedKey && normalizedValue !== undefined) {
        metadata[normalizedKey] = normalizedValue;
      }
    });
  });

  return metadata;
}

export function useCampaignUpdates(
  campaignId: string | null | undefined,
  network: "devnet" | "testnet" | "mainnet" = DEFAULT_NETWORK,
  limit = 50,
): UseCampaignUpdatesResult {
  const enabled = Boolean(campaignId);
  const config = getContractConfig(network);
  const eventType = `${config.contracts.packageId}::campaign::CampaignUpdateAdded`;

  const {
    data: eventsData,
    isPending,
    error,
    refetch,
  } = useSuiClientQuery(
    "queryEvents",
    {
      query: {
        MoveEventType: eventType,
      },
      order: "descending",
      limit,
    },
    {
      enabled,
    },
  );

  const updates = useMemo((): CampaignUpdate[] => {
    if (!enabled || !eventsData?.data || !campaignId) {
      return [];
    }

    const events = eventsData.data as SuiEvent[];

    const parsedUpdates: CampaignUpdate[] = [];

    events.forEach((event) => {
      const parsedJson = event.parsedJson as Record<string, unknown> | undefined;
      if (!parsedJson) {
        return;
      }

      const eventCampaignId = normalizeToString(parsedJson.campaign_id);
      if (
        !eventCampaignId ||
        eventCampaignId.toLowerCase() !== campaignId.toLowerCase()
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
    return parsedUpdates;
  }, [campaignId, enabled, eventsData?.data, network]);

  return {
    updates,
    isLoading: isPending,
    error: (error as Error) ?? null,
    refetch,
  };
}
