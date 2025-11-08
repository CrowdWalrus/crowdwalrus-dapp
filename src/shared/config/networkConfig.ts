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
    defaultEpochs: 3, // Default: 3 days for testing
    maxEpochs: 30, // Walrus testnet currently caps reservations at ~30 days
  },
  mainnet: {
    epochDurationDays: 14, // 14 days (2 weeks) per epoch on mainnet
    defaultEpochs: 27, // Default: ~1 year (27 epochs × 14 days = 378 days)
    maxEpochs: 53, // Max: ~2 years (53 epochs × 14 days = 742 days)
  },
  devnet: {
    epochDurationDays: 1, // Same as testnet
    defaultEpochs: 3,
    maxEpochs: 365,
  },
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
    { label: "6 months", epochs: 13, days: 182 }, // 13 epochs × 14 days = 182 days
    { label: "1 year", epochs: 27, days: 378 }, // 27 epochs × 14 days = 378 days
    { label: "2 years", epochs: 53, days: 742 }, // 53 epochs × 14 days = 742 days
  ] as StorageDurationOption[],
  devnet: [
    { label: "3 days", epochs: 3, days: 3 },
    { label: "7 days", epochs: 7, days: 7 },
    { label: "30 days", epochs: 30, days: 30 },
  ] as StorageDurationOption[],
} as const;

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
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
