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
 * Storage cost estimation result
 */
export interface StorageCostEstimate {
  totalSize: number; // Total size in bytes
  epochs: number; // Storage duration
  estimatedCost: string; // Cost in SUI tokens
  breakdown: {
    htmlSize: number;
    imagesSize: number;
  };
}

/**
 * Progress callback data for tracking campaign creation
 */
export interface CampaignCreationProgress {
  step: CampaignCreationStep;
  message: string;
  percentage?: number; // Optional progress percentage (0-100)
}