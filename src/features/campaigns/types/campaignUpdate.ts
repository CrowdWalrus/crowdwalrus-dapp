export interface CampaignUpdateStorageData {
  /** Serialized Lexical editor state (JSON string) */
  serializedContent: string;

  /** Optional identifier for the Walrus file (defaults to update.json) */
  identifier?: string;

  /** Optional plain text summary extracted from the content */
  plainTextSummary?: string;

  /** Optional headline or title for the update */
  title?: string;
}

export interface CampaignUpdateResult {
  campaignId: string;
  updateId: string;
  transactionDigest: string;
  walrusBlobId: string;
  walrusContentUrl: string;
}
