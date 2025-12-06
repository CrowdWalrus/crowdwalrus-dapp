import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getCampaignById } from "@/services/indexer-services";
import { canonicalizeCoinType } from "@/shared/utils/sui";

export type CampaignPerCoinTotals = Record<
  string,
  {
    totalRaw: bigint;
    donationCount: number;
  }
>;

export interface CampaignStatsSummary {
  statsId: string | null;
  campaignId: string | null;
  totalUsdMicro: bigint;
  totalDonationsCount: number;
  lastDonationAtMs: number | null;
}

interface UseCampaignStatsOptions {
  campaignId?: string;
  enabled?: boolean;
}

export interface UseCampaignStatsResult {
  stats: CampaignStatsSummary;
  statsId: string | null;
  totalUsdMicro: bigint;
  totalDonationsCount: number;
  perCoinTotals: CampaignPerCoinTotals | null;
  isPending: boolean;
  isPerCoinLoading: boolean;
  error: Error | null;
  perCoinError: Error | null;
  refetch: () => Promise<void>;
  fetchPerCoinTotals: (coinTypes: string[]) => Promise<CampaignPerCoinTotals>;
}

/** Read campaign stats (totals + per-coin) via indexer detail. */
export function useCampaignStats(
  options: UseCampaignStatsOptions = {},
): UseCampaignStatsResult {
  const { campaignId, enabled = true } = options;

  const query = useQuery({
    queryKey: ["indexer", "campaign", campaignId],
    queryFn: () => getCampaignById(campaignId ?? ""),
    enabled: Boolean(enabled && campaignId),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const stats = useMemo<CampaignStatsSummary>(() => {
    if (!query.data) {
      return {
        statsId: null,
        campaignId: campaignId ?? null,
        totalUsdMicro: 0n,
        totalDonationsCount: 0,
        lastDonationAtMs: null,
      };
    }

    const detail = query.data;
    const totalUsdMicro = BigInt(detail.stats?.totalUsdMicro ?? 0);
    const totalDonationsCount = detail.stats?.totalDonationsCount ?? 0;

    return {
      statsId: detail.statsId ?? null,
      campaignId: detail.campaignId ?? null,
      totalUsdMicro,
      totalDonationsCount,
      lastDonationAtMs: detail.stats?.lastDonationAtMs ?? null,
    } satisfies CampaignStatsSummary;
  }, [campaignId, query.data]);

  const perCoinTotals = useMemo<CampaignPerCoinTotals | null>(() => {
    if (!query.data) {
      return null;
    }

    const totals: CampaignPerCoinTotals = {};
    query.data.coinStats.forEach((entry) => {
      const coinType = canonicalizeCoinType(entry.coinTypeCanonical);
      totals[coinType] = {
        totalRaw: BigInt(entry.totalRaw ?? 0),
        donationCount: entry.totalDonationsCount ?? 0,
      };
    });
    return totals;
  }, [query.data]);

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const fetchPerCoinTotals = useCallback(
    async (coinTypes: string[]) => {
      if (!perCoinTotals) {
        return {};
      }
      if (!coinTypes || coinTypes.length === 0) {
        return perCoinTotals;
      }
      return Object.fromEntries(
        coinTypes
          .filter(Boolean)
          .map((coin) => [coin, perCoinTotals[coin] ?? { totalRaw: 0n, donationCount: 0 }]),
      );
    },
    [perCoinTotals],
  );

  return {
    stats,
    statsId: stats.statsId,
    totalUsdMicro: stats.totalUsdMicro,
    totalDonationsCount: stats.totalDonationsCount,
    perCoinTotals,
    isPending: query.isPending,
    isPerCoinLoading: false,
    error: (query.error as Error) ?? null,
    perCoinError: null,
    refetch,
    fetchPerCoinTotals,
  };
}
