import { formatUsdFromMicros } from "@/shared/utils/currency";
import { getWalrusUrl } from "@/services/walrus";
import {
  inferPolicyPresetFromBps,
  type PolicyPresetName,
} from "../constants/policies";
import { parseSocialLinksFromMetadata } from "./socials";
import type { SupportedNetwork } from "@/shared/types/network";
import type {
  CampaignDetail,
  CampaignSummary,
} from "@/services/indexer-services";
import type { CampaignCoinStat, CampaignData } from "../types/campaignData";
import { canonicalizeCoinType } from "@/shared/utils/sui";

function toStringMap(source: Record<string, unknown>): Record<string, string> {
  const output: Record<string, string> = {};
  Object.entries(source || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    if (typeof value === "string") {
      output[key] = value;
      return;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      output[key] = String(value);
      return;
    }
    try {
      output[key] = JSON.stringify(value);
    } catch {
      output[key] = String(value);
    }
  });
  return output;
}

function mapCoinStats(stats: CampaignDetail["coinStats"]): CampaignCoinStat[] {
  return stats.map((stat) => ({
    coinTypeCanonical: canonicalizeCoinType(stat.coinTypeCanonical),
    coinSymbol: stat.coinSymbol,
    totalRaw: BigInt(stat.totalRaw ?? 0),
    totalDonationsCount: stat.totalDonationsCount ?? 0,
    lastDonationAtMs: stat.lastDonationAtMs ?? null,
  }));
}

export interface MapCampaignOptions {
  network: SupportedNetwork;
}

/**
 * Normalize indexer campaign detail/summary into the UI-friendly `CampaignData` shape.
 * Detail is preferred; summary provides fallbacks when detail hydration fails.
 */
export function mapIndexerCampaignToData(
  detail: CampaignDetail | null,
  summary: CampaignSummary | null,
  { network }: MapCampaignOptions,
): CampaignData {
  const metadataMap = toStringMap(detail?.metadata ?? {});

  const walrusQuiltId = metadataMap["walrus_quilt_id"] ?? "";
  const walrusStorageEpochs = metadataMap["walrus_storage_epochs"] ?? "0";
  const coverImageId = metadataMap["cover_image_id"] ?? "cover.jpg";
  const category = metadataMap["category"] ?? "Other";

  const fundingGoalUsdMicro = BigInt(
    detail?.fundingGoalUsdMicro ?? summary?.fundingGoalUsdMicro ?? 0,
  );

  const totalUsdMicro = BigInt(
    detail?.stats?.totalUsdMicro ?? summary?.totalUsdMicro ?? 0,
  );

  const totalDonationsCount =
    detail?.stats?.totalDonationsCount ??
    summary?.totalDonationsCount ??
    0;

  const uniqueDonorsCount =
    detail?.stats?.uniqueDonorsCount ??
    summary?.uniqueDonorsCount ??
    0;

  const lastDonationAtMs =
    detail?.stats?.lastDonationAtMs ?? summary?.lastDonationAtMs ?? null;

  const policyPresetName: PolicyPresetName = inferPolicyPresetFromBps(
    detail?.payoutPlatformBps ?? null,
  );

  const coverImageUrl = walrusQuiltId
    ? getWalrusUrl(walrusQuiltId, network, coverImageId)
    : "";

  const descriptionUrl = walrusQuiltId
    ? getWalrusUrl(walrusQuiltId, network, "description.json")
    : "";

  const coinStats = mapCoinStats(detail?.coinStats ?? []);
  const socialLinks = parseSocialLinksFromMetadata(metadataMap);

  return {
    id: detail?.campaignId ?? summary?.campaignId ?? "",
    adminId: detail?.adminId ?? "",
    creatorAddress: detail?.ownerAddress ?? summary?.ownerAddress ?? "",
    statsId: detail?.statsId ?? "",
    name: detail?.name ?? summary?.name ?? "",
    shortDescription: detail?.shortDescription ?? summary?.shortDescription ?? "",
    subdomainName: detail?.subdomainName ?? summary?.subdomainName ?? "",
    recipientAddress: detail?.payoutRecipientAddress ?? "",
    startDateMs: detail?.startDateMs ?? summary?.startDateMs ?? 0,
    endDateMs: detail?.endDateMs ?? summary?.endDateMs ?? 0,
    createdAtMs: detail?.createdAtMs ?? summary?.createdAtMs ?? 0,
    isVerified: detail?.isVerified ?? summary?.isVerified ?? false,
    isActive: detail?.isActive ?? summary?.isActive ?? false,
    isDeleted: detail?.isDeleted ?? summary?.isDeleted ?? false,
    deletedAtMs: detail?.deletedAtMs ?? null,
    fundingGoal: formatUsdFromMicros(fundingGoalUsdMicro),
    fundingGoalUsdMicro,
    category,
    walrusQuiltId,
    walrusStorageEpochs,
    coverImageId,
    policyPresetName,
    payoutPlatformBps: detail?.payoutPlatformBps,
    payoutPlatformAddress: detail?.payoutPlatformAddress,
    socialLinks,
    coverImageUrl,
    descriptionUrl,
    parametersLocked: detail?.parametersLocked ?? summary?.parametersLocked ?? false,
    updateCount: detail?.updateCount ?? summary?.updateCount ?? 0,
    totalUsdMicro,
    totalDonationsCount,
    uniqueDonorsCount,
    lastDonationAtMs,
    coinStats,
    metadata: metadataMap,
  } satisfies CampaignData;
}
