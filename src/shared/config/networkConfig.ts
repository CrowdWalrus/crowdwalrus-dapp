import { getFullnodeUrl } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";

import contractsConfig from "./contracts";
import type { SupportedNetwork } from "@/shared/types/network";

/**
 * Default network for the application
 * Change this single value to switch between testnet and mainnet
 */
export const DEFAULT_NETWORK: SupportedNetwork = "testnet";

/**
 * WAL token coin types for each network
 */
export const WAL_COIN_TYPE = {
  testnet:
    "0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL",
  mainnet:
    "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL",
  devnet:
    "0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL", // Using testnet for devnet
} as const;

/**
 * Walrus epoch configuration for each network
 * Epoch = unit of time for Walrus storage pricing
 */
export const WALRUS_EPOCH_CONFIG = {
  testnet: {
    epochDurationDays: 1, // 1 day per epoch on testnet
    minEpochs: 1,
    defaultEpochs: 3, // Default: 3 days for testing
    maxEpochs: 30, // Walrus testnet currently caps reservations at ~30 days
  },
  mainnet: {
    epochDurationDays: 14, // 14 days (2 weeks) per epoch on mainnet
    minEpochs: 27, // Minimum: ~1 year (27 epochs × 14 days = 378 days)
    defaultEpochs: 27, // Default: ~1 year (27 epochs × 14 days = 378 days)
    maxEpochs: 78, // Max: ~3 years (78 epochs × 14 days = 1092 days)
  },
  devnet: {
    epochDurationDays: 1, // Same as testnet
    minEpochs: 1,
    defaultEpochs: 3,
    maxEpochs: 365,
  },
} as const;

export const PROFILE_AVATAR_STORAGE_DEFAULT_EPOCHS = {
  testnet: 20, // 20 days on Walrus testnet
  mainnet: WALRUS_EPOCH_CONFIG.mainnet.defaultEpochs, // Match campaign default: 27 epochs × 14 days = 378 days
  devnet: 20,
} as const;

/**
 * Storage duration options for registration period dropdown
 */
export interface StorageDurationOption {
  label: string;
  epochs: number;
  days: number;
}

export const STORAGE_DURATION_OPTIONS = {
  testnet: [
    { label: "3 days", epochs: 3, days: 3 },
    { label: "7 days", epochs: 7, days: 7 },
    { label: "30 days", epochs: 30, days: 30 },
  ] as StorageDurationOption[],
  mainnet: [
    { label: "1 year", epochs: 27, days: 378 }, // 27 epochs × 14 days = 378 days
    { label: "2 years", epochs: 53, days: 742 }, // 53 epochs × 14 days = 742 days
    { label: "3 years", epochs: 78, days: 1092 }, // 78 epochs × 14 days = 1092 days
  ] as StorageDurationOption[],
  devnet: [
    { label: "3 days", epochs: 3, days: 3 },
    { label: "7 days", epochs: 7, days: 7 },
    { label: "30 days", epochs: 30, days: 30 },
  ] as StorageDurationOption[],
} as const;

export const SUI_EXPLORER_URLS: Record<SupportedNetwork, string> = {
  mainnet: "https://suivision.xyz",
  testnet: "https://testnet.suivision.xyz",
  devnet: "https://testnet.suivision.xyz",
};

const devnetContracts = contractsConfig.devnet.contracts;
const testnetContracts = contractsConfig.testnet.contracts;
const mainnetContracts = contractsConfig.mainnet.contracts;

const devnetCampaignDomain = contractsConfig.devnet.campaignDomain;
const testnetCampaignDomain = contractsConfig.testnet.campaignDomain;
const mainnetCampaignDomain = contractsConfig.mainnet.campaignDomain;

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    devnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        walCoinType: WAL_COIN_TYPE.devnet,
        epochConfig: WALRUS_EPOCH_CONFIG.devnet,
        storageDurationOptions: STORAGE_DURATION_OPTIONS.devnet,
        contracts: devnetContracts,
        campaignDomain: devnetCampaignDomain,
        avatarStorageEpochs:
          PROFILE_AVATAR_STORAGE_DEFAULT_EPOCHS.devnet,
      },
    },
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        walCoinType: WAL_COIN_TYPE.testnet,
        epochConfig: WALRUS_EPOCH_CONFIG.testnet,
        storageDurationOptions: STORAGE_DURATION_OPTIONS.testnet,
        contracts: testnetContracts,
        campaignDomain: testnetCampaignDomain,
        avatarStorageEpochs:
          PROFILE_AVATAR_STORAGE_DEFAULT_EPOCHS.testnet,
      },
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
      variables: {
        walCoinType: WAL_COIN_TYPE.mainnet,
        epochConfig: WALRUS_EPOCH_CONFIG.mainnet,
        storageDurationOptions: STORAGE_DURATION_OPTIONS.mainnet,
        contracts: mainnetContracts,
        campaignDomain: mainnetCampaignDomain,
        avatarStorageEpochs:
          PROFILE_AVATAR_STORAGE_DEFAULT_EPOCHS.mainnet,
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
