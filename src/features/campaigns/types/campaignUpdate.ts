export interface CampaignUpdateStorageData {
  /** Serialized Lexical editor state (JSON string) */
  serializedContent: string;

  /** Optional identifier for the Walrus file (defaults to update.json) */
  identifier?: string;

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

export interface CampaignUpdate {
  updateId: string;
  sequence: number;
  createdAtMs: number;
  author?: string;
  metadata: Record<string, string>;
  walrusBlobId?: string;
  walrusContentPath?: string;
  walrusContentUrl?: string;
}
