export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CampaignSummary {
  campaignId: string;
  ownerAddress: string | null;
  name: string;
  shortDescription: string;
  subdomainName: string;
  fundingGoalUsdMicro: number;
  startDateMs: number;
  endDateMs: number;
  createdAtMs: number;
  updateCount: number;
  parametersLocked: boolean;
  isVerified: boolean;
  isActive: boolean;
  isDeleted: boolean;
  totalUsdMicro: number | null;
  totalDonationsCount: number | null;
  lastDonationAtMs: number | null;
}

export interface CampaignResolutionResponse {
  campaignId: string;
  subdomainName: string;
  resolvedVia: "campaign_id" | "campaign_subdomain" | "subdomain_registry";
}

export interface CampaignStatsResponse {
  statsId: string;
  totalUsdMicro: number;
  totalDonationsCount: number;
  lastDonationAtMs: number | null;
}

export interface CampaignCoinStatsResponse {
  coinTypeCanonical: string;
  coinSymbol: string;
  totalRaw: number;
  totalDonationsCount: number;
  lastDonationAtMs: number | null;
}

export interface CampaignDetail {
  campaignId: string;
  ownerAddress: string | null;
  adminId: string;
  name: string;
  shortDescription: string;
  subdomainName: string;
  metadata: Record<string, unknown>;
  fundingGoalUsdMicro: number;
  payoutPlatformBps: number;
  payoutPlatformAddress: string;
  payoutRecipientAddress: string;
  statsId: string;
  startDateMs: number;
  endDateMs: number;
  createdAtMs: number;
  updateCount: number;
  parametersLocked: boolean;
  deletedAtMs: number | null;
  isVerified: boolean;
  isActive: boolean;
  isDeleted: boolean;
  checkpointSequenceNumber: number;
  txDigest: string;
  stats: CampaignStatsResponse | null;
  coinStats: CampaignCoinStatsResponse[];
}

export interface CampaignUpdateResponse {
  updateId: string;
  campaignId: string;
  sequence: number;
  author: string;
  metadata: Record<string, unknown>;
  createdAtMs: number;
  checkpointSequenceNumber: number;
  txDigest: string;
}

export interface DonationResponse {
  id: number;
  campaignId: string;
  donor: string;
  coinTypeCanonical: string;
  coinSymbol: string;
  amountRaw: number;
  amountUsdMicro: number;
  platformAmountRaw: number;
  recipientAmountRaw: number;
  platformAmountUsdMicro: number;
  recipientAmountUsdMicro: number;
  platformBps: number;
  platformAddress: string;
  recipientAddress: string;
  timestampMs: number;
  checkpointSequenceNumber: number;
  txDigest: string;
}

export interface SubdomainResponse {
  subdomainName: string;
  campaignId: string;
  targetAddress: string;
  registeredAtMs: number | null;
  removedAtMs: number | null;
  checkpointSequenceNumber: number;
  txDigest: string;
}

export interface ProfileDataResponse {
  profileId: string;
  owner: string;
  totalUsdMicro: number;
  totalDonationsCount: number;
  badgeLevelsEarned: number;
  metadata: Record<string, unknown>;
  checkpointSequenceNumber: number;
  txDigest: string;
}

export interface BadgeMintResponse {
  owner: string;
  level: number;
  profileId: string;
  timestampMs: number;
  checkpointSequenceNumber: number;
  txDigest: string;
}

export interface ProfileResponse {
  profile: ProfileDataResponse;
  badges: BadgeMintResponse[];
  donations: PaginatedResponse<DonationResponse>;
}

export interface TokenResponse {
  coinType: string;
  symbol: string;
  name: string;
  decimals: number;
  pythFeedIdHex: string;
  maxAgeMs: number;
  enabled: boolean;
  lastUpdatedMs: number;
  checkpointSequenceNumber: number;
  txDigest: string;
}

export interface PolicyResponse {
  policyName: string;
  platformBps: number;
  platformAddress: string;
  enabled: boolean;
  lastUpdatedMs: number;
  checkpointSequenceNumber: number;
  txDigest: string;
}

export interface StatsResponse {
  network: string;
  latestIngestedCheckpoint: number | null;
  committedCheckpoint: number | null;
  checkpointLag: number | null;
  maxAllowedLag: number;
  dbOk: boolean;
  campaigns: number;
  activeCampaigns: number;
  verifiedCampaigns: number;
  donationsCount: number;
  donationsTotalUsdMicro: number;
  profiles: number;
  enabledTokens: number;
  enabledPolicies?: number;
}

export interface IndexerErrorResponse {
  status: number;
  code: string;
  message: string;
}
