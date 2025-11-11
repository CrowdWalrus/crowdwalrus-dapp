import type { SupportedNetwork } from "@/shared/types/network";

/**
 * Smart Contract and Walrus Configuration
 *
 * TODO: Fill in the actual addresses after deploying contracts
 * This configuration centralizes all contract addresses and Walrus settings
 * for different networks (devnet, testnet, mainnet)
 */

/**
 * Contract addresses for each network
 */
export interface ContractAddresses {
  packageId: string;
  crowdWalrusObjectId: string;
  suinsManagerObjectId: string;
  suinsObjectId: string;
  policyRegistryObjectId: string;
  profilesRegistryObjectId: string;
  tokenRegistryObjectId: string;
  badgeConfigObjectId: string;
}

/**
 * Walrus network configuration
 */
export interface WalrusConfig {
  network: SupportedNetwork;
  uploadRelay?: string;
  aggregatorUrl: string;
  systemObjectId: string; // Walrus system object on Sui for pricing queries
  subsidyObjectId: string; // Walrus subsidy object for discounted pricing
}

/**
 * Complete network configuration
 */
export interface PythOracleConfig {
  hermesUrl: string;
  pythStateId: string;
  wormholeStateId: string;
}

export interface NetworkContractConfig {
  contracts: ContractAddresses;
  walrus: WalrusConfig;
  campaignDomain: string;
  pyth: PythOracleConfig;
}

// ============================================================================
// DEVNET Configuration
// ============================================================================

const DEVNET_CONFIG: NetworkContractConfig = {
  contracts: {
    // TODO: Add your devnet package ID after deployment
    packageId: "YOUR_DEVNET_PACKAGE_ID_HERE",

    // TODO: Add your CrowdWalrus shared object ID
    crowdWalrusObjectId: "YOUR_DEVNET_CROWDWALRUS_OBJECT_ID_HERE",

    // TODO: Add SuiNS Manager object ID for devnet
    suinsManagerObjectId: "YOUR_DEVNET_SUINS_MANAGER_OBJECT_ID_HERE",

    // TODO: Add SuiNS registry object ID for devnet
    suinsObjectId: "YOUR_DEVNET_SUINS_OBJECT_ID_HERE",

    // TODO: Add PolicyRegistry shared object ID
    policyRegistryObjectId: "YOUR_DEVNET_POLICY_REGISTRY_OBJECT_ID_HERE",

    // TODO: Add ProfilesRegistry shared object ID
    profilesRegistryObjectId: "YOUR_DEVNET_PROFILES_REGISTRY_OBJECT_ID_HERE",

    // TODO: Add TokenRegistry shared object ID
    tokenRegistryObjectId: "YOUR_DEVNET_TOKEN_REGISTRY_OBJECT_ID_HERE",

    // TODO: Add BadgeConfig shared object ID
    badgeConfigObjectId: "YOUR_DEVNET_BADGE_CONFIG_OBJECT_ID_HERE",
  },
  walrus: {
    network: "devnet",
    uploadRelay: "https://relay.walrus.site",
    aggregatorUrl: "https://aggregator.walrus-testnet.walrus.space/v1",
    // Devnet uses testnet system object
    systemObjectId:
      "0x98ebc47370603fe81d9e15491b2f1443d619d1dab720d586e429ed233e1255c1",
    // Testnet doesn't have a subsidy object - subsidies are implicit in pricing
    subsidyObjectId: "",
  },
  campaignDomain: "crowdwalrus-test.sui",
  pyth: {
    hermesUrl: "https://hermes-beta.pyth.network",
    pythStateId: "YOUR_DEVNET_PYTH_STATE_ID_HERE",
    wormholeStateId: "YOUR_DEVNET_WORMHOLE_STATE_ID_HERE",
  },
};

// ============================================================================
// TESTNET Configuration
// ============================================================================

const TESTNET_CONFIG: NetworkContractConfig = {
  contracts: {
    // Package ID from deployment
    packageId:
      "0x5abd06b4c77fca5cdf684f77a2a06c1303218bf85ac27dde3cb07243655a3e9e",

    // CrowdWalrus shared object from deployment
    crowdWalrusObjectId:
      "0xc6632fb8fc6b2ceb5dee81292855a5def8a7c4289c8c7aa9908d0d5373e1376b",

    // SuiNS Manager shared object from deployment
    suinsManagerObjectId:
      "0x73d8313a788722f5be2ea362cbb33ee9afac241d2bb88541aa6a93bf08e245ac",

    // SuiNS registry object ID for custom deployment (crowdwalrus-testnet-core-v2)
    suinsObjectId:
      "0x300369e8909b9a6464da265b9a5a9ab6fe2158a040e84e808628cde7a07ee5a3",

    // PolicyRegistry shared object from Phase 2 deployment
    policyRegistryObjectId:
      "0xd8f6ef8263676816f298c1f7f311829dd3ee67e26993832e842cb7660859f906",

    // ProfilesRegistry shared object from Phase 2 deployment
    profilesRegistryObjectId:
      "0x2284d6443cbe5720da6b658237b66176a7c9746d2f8322c8a5cd0310357766b0",

    // TokenRegistry shared object from Phase 2 deployment
    tokenRegistryObjectId:
      "0x92909eb4d9ff776ef04ff37fb5e100426dabc3e2a3bae2e549bde01ebd410ae4",

    // BadgeConfig shared object from Phase 2 deployment
    badgeConfigObjectId:
      "0x6faec79a14bcd741a97d5a42722c49e6abed148955e87cdce0ad9e505b6c5412",
  },
  walrus: {
    network: "testnet",
    uploadRelay: "https://relay.walrus.site",
    aggregatorUrl: "https://aggregator.walrus-testnet.walrus.space/v1",
    systemObjectId:
      "0x98ebc47370603fe81d9e15491b2f1443d619d1dab720d586e429ed233e1255c1",
    // Testnet doesn't have a subsidy object - subsidies are implicit in pricing
    subsidyObjectId: "",
  },
  campaignDomain: "crowdwalrus-test.sui",
  pyth: {
    hermesUrl: "https://hermes-beta.pyth.network",
    // Temporary Beta channel until the on-chain package is upgraded.
    pythStateId:
      "0x243759059f4c3111179da5878c12f68d612c21a8d54d85edc86164bb18be1c7c",
    wormholeStateId:
      "0x31358d198147da50db32eda2562951d53973a0c0ad5ed738e9b17d88b213d790",
  },
};

// ============================================================================
// MAINNET Configuration
// ============================================================================

const MAINNET_CONFIG: NetworkContractConfig = {
  contracts: {
    // TODO: Add your mainnet package ID after deployment
    packageId: "YOUR_MAINNET_PACKAGE_ID_HERE",

    // TODO: Add your CrowdWalrus shared object ID
    crowdWalrusObjectId: "YOUR_MAINNET_CROWDWALRUS_OBJECT_ID_HERE",

    // TODO: Add SuiNS Manager object ID for mainnet
    suinsManagerObjectId: "YOUR_MAINNET_SUINS_MANAGER_OBJECT_ID_HERE",

    // TODO: Add SuiNS registry object ID for mainnet
    suinsObjectId: "YOUR_MAINNET_SUINS_OBJECT_ID_HERE",

    // TODO: Add PolicyRegistry shared object ID
    policyRegistryObjectId: "YOUR_MAINNET_POLICY_REGISTRY_OBJECT_ID_HERE",

    // TODO: Add ProfilesRegistry shared object ID
    profilesRegistryObjectId: "YOUR_MAINNET_PROFILES_REGISTRY_OBJECT_ID_HERE",

    // TODO: Add TokenRegistry shared object ID
    tokenRegistryObjectId: "YOUR_MAINNET_TOKEN_REGISTRY_OBJECT_ID_HERE",

    // TODO: Add BadgeConfig shared object ID
    badgeConfigObjectId: "YOUR_MAINNET_BADGE_CONFIG_OBJECT_ID_HERE",
  },
  walrus: {
    network: "mainnet",
    uploadRelay: "https://relay.walrus.site",
    aggregatorUrl: "https://aggregator.walrus.space/v1",
    systemObjectId:
      "0x2134d52768ea07e8c43570ef975eb3e4c27a39fa6396bef985b5abc58d03ddd2",
    subsidyObjectId:
      "0xb606eb177899edc2130c93bf65985af7ec959a2755dc126c953755e59324209e",
  },
  campaignDomain: "crowdwalrus.sui",
  pyth: {
    hermesUrl: "https://hermes.pyth.network",
    pythStateId: "YOUR_MAINNET_PYTH_STATE_ID_HERE",
    wormholeStateId: "YOUR_MAINNET_WORMHOLE_STATE_ID_HERE",
  },
};

// ============================================================================
// Constants
// ============================================================================

/**
 * Sui Clock object - constant across all networks
 */
export const CLOCK_OBJECT_ID = "0x6";

/**
 * Storage cost multiplier for Walrus
 * Cost = blob_size * STORAGE_COST_MULTIPLIER * price_per_byte * epochs
 */
export const STORAGE_COST_MULTIPLIER = 5;

// ============================================================================
// Exports
// ============================================================================

/**
 * Get contract configuration for a specific network
 */
export function getContractConfig(
  network: SupportedNetwork,
): NetworkContractConfig {
  switch (network) {
    case "devnet":
      return DEVNET_CONFIG;
    case "testnet":
      return TESTNET_CONFIG;
    case "mainnet":
      return MAINNET_CONFIG;
    default:
      throw new Error(`Unknown network: ${network}`);
  }
}

/**
 * Default export for easy access
 */
export default {
  devnet: DEVNET_CONFIG,
  testnet: TESTNET_CONFIG,
  mainnet: MAINNET_CONFIG,
  getContractConfig,
  CLOCK_OBJECT_ID,
  STORAGE_COST_MULTIPLIER,
};
