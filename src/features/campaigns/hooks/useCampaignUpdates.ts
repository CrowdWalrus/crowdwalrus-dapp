import { useMemo } from "react";

import { useCampaignUpdates as useIndexerCampaignUpdates } from "@/hooks/indexer/useCampaignUpdates";
import type { CampaignUpdate } from "@/features/campaigns/types/campaignUpdate";
import { getWalrusUrl } from "@/services/walrus";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";

interface UseCampaignUpdatesResult {
  updates: CampaignUpdate[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const WALRUS_BLOB_KEY = "walrus_blob_id";
const WALRUS_CONTENT_PATH_KEY = "walrus_content_path";

function toStringRecord(metadata: Record<string, unknown>): Record<string, string> {
  const output: Record<string, string> = {};
  Object.entries(metadata || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    output[key] = typeof value === "string" ? value : String(value);
  });
  return output;
}

/** Map indexer campaign updates into UI-friendly `CampaignUpdate` objects. */
export function useCampaignUpdates(
  campaignId: string | null | undefined,
  network: SupportedNetwork = DEFAULT_NETWORK,
  pageSize = 50,
): UseCampaignUpdatesResult {
  const query = useIndexerCampaignUpdates(campaignId ?? null, {
    pageSize,
    enabled: Boolean(campaignId),
  });

  const updates = useMemo<CampaignUpdate[]>(() => {
    if (!query.data?.pages || !campaignId) {
      return [];
    }

    const mapped: CampaignUpdate[] = [];

    query.data.pages.forEach((page) => {
      page.data.forEach((entry) => {
        const metadata = toStringRecord(entry.metadata ?? {});
        const walrusBlobId = metadata[WALRUS_BLOB_KEY] ?? "";
        const walrusContentPath = metadata[WALRUS_CONTENT_PATH_KEY] ?? "update.json";
        const walrusContentUrl = walrusBlobId
          ? getWalrusUrl(walrusBlobId, network, walrusContentPath)
          : undefined;

        mapped.push({
          updateId: entry.updateId,
          sequence: entry.sequence,
          createdAtMs: entry.createdAtMs,
          author: entry.author,
          metadata,
          walrusBlobId,
          walrusContentPath,
          walrusContentUrl,
        });
      });
    });

    return mapped.sort((a, b) => b.sequence - a.sequence);
  }, [campaignId, network, query.data?.pages]);

  const handleRefetch = () => {
    void query.refetch();
  };

  return {
    updates,
    isLoading: query.isPending,
    error: (query.error as Error) ?? null,
    refetch: handleRefetch,
  };
}
