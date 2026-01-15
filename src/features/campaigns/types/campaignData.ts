import type { CampaignSocialLink } from "./campaign";
import type { PolicyPresetName } from "../constants/policies";

export interface CampaignCoinStat {
  coinTypeCanonical: string;
  coinSymbol: string;
  totalRaw: bigint;
  totalDonationsCount: number;
  lastDonationAtMs: number | null;
}

export interface CampaignData {
  id: string;
  adminId: string;
  creatorAddress: string;
  ownerProfileSubdomainName?: string | null;
  statsId: string;
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
  fundingGoal: string;
  fundingGoalUsdMicro: bigint;
  category: string;
  walrusQuiltId: string;
  walrusStorageEpochs: string;
  coverImageId: string;
  policyPresetName: PolicyPresetName;
  payoutPlatformBps?: number;
  payoutPlatformAddress?: string;
  socialLinks: CampaignSocialLink[];
  coverImageUrl: string;
  descriptionUrl: string;
  parametersLocked: boolean;
  updateCount: number;
  totalUsdMicro: bigint;
  recipientTotalUsdMicro: bigint;
  totalDonationsCount: number;
  uniqueDonorsCount: number;
  lastDonationAtMs: number | null;
  coinStats: CampaignCoinStat[];
  metadata: Record<string, string>;
}
