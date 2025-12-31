export interface PendingCampaignDonation {
  txDigest: string;
  donor: string;
  coinTypeCanonical: string;
  coinSymbol: string;
  amountRaw: bigint;
  amountUsdMicro: bigint | null;
  platformBps: number;
  timestampMs: number;
}
