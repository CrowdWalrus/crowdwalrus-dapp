/**
 * Campaign-related TypeScript type definitions
 * These types define the data structures for campaign creation and management
 */

/**
 * Form data collected from the user during campaign creation
 */
export interface CampaignFormData {
  // Basic Information
  name: string;
  short_description: string;
  subdomain_name: string;
  category: string;

  // Fundraising Details
  funding_goal: string; // In SUI tokens
  start_date: Date;
  end_date: Date;

  // Rich Content
  full_description: string; // HTML content
  cover_image: File;

  // Social Links (optional)
  social_twitter?: string;
  social_discord?: string;
  social_website?: string;

  // Storage Settings
  storage_epochs?: number; // Default will be set in config
}

/**
 * Metadata structure for the VecMap<String, String> on Sui
 * All values must be strings as per the smart contract
 */
export interface CampaignMetadata {
  funding_goal: string;
  walrus_quilt_id: string; // Blob ID as string (u256)
  walrus_storage_epochs: string;
  category: string;
  cover_image_id: string; // Identifier within the Quilt
  social_twitter?: string;
  social_discord?: string;
  social_website?: string;
  [key: string]: string | undefined; // Allow additional custom metadata
}

/**
 * Result from uploading campaign files to Walrus
 */
export interface WalrusUploadResult {
  blobId: string; // u256 as string
  blobObject: string; // Sui object ID of the blob
  files: {
    identifier: string;
    size: number;
  }[];
  cost: string; // Storage cost in SUI
}

/**
 * Final result after successful campaign creation
 */
export interface CreateCampaignResult {
  campaignId: string; // Sui object ID
  transactionDigest: string;
  walrusBlobId: string;
  subdomain: string;
  walrusDescriptionUrl: string; // URL to fetch description.html from Walrus
  walrusCoverImageUrl: string; // URL to fetch cover.jpg from Walrus
}

/**
 * Steps in the campaign creation process for progress tracking
 */
export enum CampaignCreationStep {
  IDLE = 'idle',
  VALIDATING = 'validating',
  PREPARING_FILES = 'preparing_files',
  UPLOADING_TO_WALRUS = 'uploading_to_walrus',
  BUILDING_TRANSACTION = 'building_transaction',
  EXECUTING_TRANSACTION = 'executing_transaction',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Custom error types for campaign creation
 */
export class CampaignCreationError extends Error {
  constructor(
    message: string,
    public step: CampaignCreationStep,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'CampaignCreationError';
  }
}

export class WalrusUploadError extends CampaignCreationError {
  constructor(message: string, originalError?: unknown) {
    super(message, CampaignCreationStep.UPLOADING_TO_WALRUS, originalError);
    this.name = 'WalrusUploadError';
  }
}

export class TransactionBuildError extends CampaignCreationError {
  constructor(message: string, originalError?: unknown) {
    super(message, CampaignCreationStep.BUILDING_TRANSACTION, originalError);
    this.name = 'TransactionBuildError';
  }
}

export class TransactionExecutionError extends CampaignCreationError {
  constructor(message: string, originalError?: unknown) {
    super(message, CampaignCreationStep.EXECUTING_TRANSACTION, originalError);
    this.name = 'TransactionExecutionError';
  }
}

/**
 * Storage cost estimation result with detailed breakdown
 */
export interface StorageCostEstimate {
  // Size information
  rawSize: number;        // Original file sizes in bytes
  encodedSize: number;    // Size after Walrus encoding (5x + metadata)
  metadataSize: number;   // Fixed metadata overhead (64MB)

  // Duration
  epochs: number;         // Storage duration in epochs

  // Costs in WAL tokens
  storageCostWal: number; // Storage cost (epochs × size)
  uploadCostWal: number;  // One-time upload/write cost
  totalCostWal: number;   // Total cost in WAL

  // Legacy field for backward compatibility (deprecated)
  estimatedCost: string;  // Total cost in WAL as string

  // Breakdown by file type
  breakdown: {
    htmlSize: number;     // Size of description.html
    imagesSize: number;   // Size of cover image
  };

  // Pricing information
  pricingTimestamp: number; // When pricing was fetched
  network: 'testnet' | 'mainnet';
}

/**
 * Progress callback data for tracking campaign creation
 */
export interface CampaignCreationProgress {
  step: CampaignCreationStep;
  message: string;
  percentage?: number; // Optional progress percentage (0-100)
}