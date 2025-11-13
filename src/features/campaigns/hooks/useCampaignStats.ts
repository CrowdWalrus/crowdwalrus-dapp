import { useCallback, useEffect, useMemo, useState } from "react";
import { useSuiClient, useSuiClientQuery } from "@mysten/dapp-kit";
import { getContractConfig } from "@/shared/config/contracts";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";
import {
  parseU64BigIntFromMove,
  parseU128BigIntFromMove,
  parseU64FromMove,
} from "@/shared/utils/onchainParsing";

interface CampaignStatsMoveFields {
  parent_id?: string;
  total_usd_micro?: unknown;
  total_donations_count?: unknown;
}

interface CampaignMoveFieldsForStats {
  stats_id?: string;
}

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
}

interface UseCampaignStatsOptions {
  campaignId?: string;
  statsId?: string;
  network?: SupportedNetwork;
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

export function useCampaignStats(
  options: UseCampaignStatsOptions = {},
): UseCampaignStatsResult {
  const {
    campaignId,
    statsId,
    network = DEFAULT_NETWORK,
    enabled = true,
  } = options;

  const client = useSuiClient();
  const config = getContractConfig(network);

  const shouldFetchCampaign = Boolean(enabled && !statsId && campaignId);

  const {
    data: campaignObject,
    isPending: isCampaignPending,
    error: campaignError,
    refetch: refetchCampaign,
  } = useSuiClientQuery(
    "getObject",
    {
      id: campaignId ?? "",
      options: {
        showContent: true,
      },
    },
    {
      enabled: shouldFetchCampaign,
    },
  );

  const derivedStatsId = useMemo(() => {
    if (typeof statsId === "string" && statsId.length > 0) {
      return statsId;
    }

    const content = campaignObject?.data?.content;
    if (!content || content.dataType !== "moveObject") {
      return null;
    }

    const fields = content.fields as CampaignMoveFieldsForStats;
    if (typeof fields?.stats_id === "string" && fields.stats_id.length > 0) {
      return fields.stats_id;
    }

    return null;
  }, [campaignObject, statsId]);

  const {
    data: statsObject,
    isPending: isStatsPending,
    error: statsError,
    refetch: refetchStats,
  } = useSuiClientQuery(
    "getObject",
    {
      id: derivedStatsId ?? "",
      options: {
        showContent: true,
      },
    },
    {
      enabled: Boolean(enabled && derivedStatsId),
    },
  );

  const statsSummary = useMemo<CampaignStatsSummary>(() => {
    const content = statsObject?.data?.content;
    if (!content || content.dataType !== "moveObject" || !derivedStatsId) {
      return {
        statsId: derivedStatsId ?? null,
        campaignId: null,
        totalUsdMicro: 0n,
        totalDonationsCount: 0,
      };
    }

    const fields = content.fields as CampaignStatsMoveFields;
    return {
      statsId: derivedStatsId,
      campaignId:
        typeof fields.parent_id === "string" ? fields.parent_id : null,
      totalUsdMicro: parseU64BigIntFromMove(fields.total_usd_micro, 0n),
      totalDonationsCount: parseU64FromMove(
        fields.total_donations_count,
        0,
      ),
    };
  }, [derivedStatsId, statsObject]);

  const [perCoinTotals, setPerCoinTotals] = useState<CampaignPerCoinTotals | null>(null);
  const [isPerCoinLoading, setIsPerCoinLoading] = useState(false);
  const [perCoinError, setPerCoinError] = useState<Error | null>(null);

  useEffect(() => {
    setPerCoinTotals(null);
    setPerCoinError(null);
  }, [derivedStatsId]);

  /**
   * Fetch per-coin aggregates for the provided Move coin type strings
   * (e.g. `0x2::sui::SUI`). Returns zeros for coins with no donations and
   * gracefully handles missing dynamic fields.
   */
  const fetchPerCoinTotals = useCallback(
    async (coinTypes: string[]) => {
      if (!derivedStatsId || coinTypes.length === 0) {
        setPerCoinTotals(null);
        return {};
      }

      setIsPerCoinLoading(true);
      setPerCoinError(null);

      try {
        const entries = await Promise.all(
          coinTypes.map(async (coinTypeRaw) => {
            const coinType = coinTypeRaw?.trim();
            if (!coinType) {
              return null;
            }

            const keyType = `${config.contracts.packageId}::campaign_stats::PerCoinKey<${coinType}>`;

            try {
              const response = await client.getDynamicFieldObject({
                parentId: derivedStatsId,
                name: {
                  type: keyType,
                  value: {},
                },
              });

              const perCoinContent = response.data?.content;
              if (!perCoinContent || perCoinContent.dataType !== "moveObject") {
                return [coinType, { totalRaw: 0n, donationCount: 0 }] as const;
              }

              const valueFields = (
                (perCoinContent.fields as {
                  value?: {
                    fields?: {
                      total_raw?: unknown;
                      donation_count?: unknown;
                    };
                  };
                })?.value?.fields ?? {}
              );

              return [
                coinType,
                {
                  totalRaw: parseU128BigIntFromMove(
                    valueFields.total_raw,
                    0n,
                  ),
                  donationCount: parseU64FromMove(
                    valueFields.donation_count,
                    0,
                  ),
                },
              ] as const;
            } catch (error) {
              console.warn(
                `[useCampaignStats] Failed to fetch per-coin stats for ${coinType}`,
                error,
              );
              return [
                coinType,
                { totalRaw: 0n, donationCount: 0 },
              ] as const;
            }
          }),
        );

        const filtered = entries.filter(
          (
            entry,
          ): entry is [string, { totalRaw: bigint; donationCount: number }] =>
            Array.isArray(entry),
        );

        const mapped = Object.fromEntries(filtered);
        setPerCoinTotals(mapped);
        return mapped;
      } catch (error) {
        const err =
          error instanceof Error
            ? error
            : new Error("Failed to load per-coin totals");
        setPerCoinError(err);
        return {};
      } finally {
        setIsPerCoinLoading(false);
      }
    },
    [client, config.contracts.packageId, derivedStatsId],
  );

  const effectiveCampaignPending = shouldFetchCampaign ? isCampaignPending : false;
  const isPending = Boolean(effectiveCampaignPending || isStatsPending);

  const normalizedCampaignError = shouldFetchCampaign
    ? (campaignError as Error | null)
    : null;
  const combinedError = (normalizedCampaignError ?? statsError) as Error | null;

  const refetch = useCallback(async () => {
    if (shouldFetchCampaign) {
      await refetchCampaign();
    }
    if (derivedStatsId) {
      await refetchStats();
    }
  }, [derivedStatsId, refetchCampaign, refetchStats, shouldFetchCampaign]);

  return {
    stats: statsSummary,
    statsId: statsSummary.statsId,
    totalUsdMicro: statsSummary.totalUsdMicro,
    totalDonationsCount: statsSummary.totalDonationsCount,
    perCoinTotals,
    isPending,
    isPerCoinLoading,
    error: combinedError,
    perCoinError,
    refetch,
    fetchPerCoinTotals,
  };
}
