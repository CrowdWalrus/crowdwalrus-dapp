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
      "0xc762a509c02849b7ca0b63eb4226c1fb87aed519af51258424a3591faaacac10",

    // CrowdWalrus shared object from deployment
    crowdWalrusObjectId:
      "0x10e5b1e7f63c33d8e49eeac79168badfb9b271209bd12a59bbcde1ecd0187596",

    // SuiNS Manager shared object from deployment
    suinsManagerObjectId:
      "0x48ceb4364109da3b9cd889d29dc9e14bafa5983777ccaa3f5d6385958b8190cf",

    // SuiNS registry object ID for custom deployment (crowdwalrus-testnet-core-v2)
    suinsObjectId:
      "0x300369e8909b9a6464da265b9a5a9ab6fe2158a040e84e808628cde7a07ee5a3",

    // PolicyRegistry shared object from Phase 2 deployment
    policyRegistryObjectId:
      "0xaf5058f1ff30262fdeeeaa325b4b1ce12a73015abbf22867f63e9f449bb9e8c3",

    // ProfilesRegistry shared object from Phase 2 deployment
    profilesRegistryObjectId:
      "0xd72f3907908b0575afea266c457c0109690ab11e8568106364c76e2444c2aeac",

    // TokenRegistry shared object from Phase 2 deployment
    tokenRegistryObjectId:
      "0xee1330d94cd954ae58fd18a8336738562f05487fae56dda9c655f461eac52b6f",

    // BadgeConfig shared object from Phase 2 deployment
    badgeConfigObjectId:
      "0x71c1e75eb42a29a81680f9f1e454e87468561a5cd28e2217e841c6693d00ea23",
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
    pythStateId:
      "0xd3e79c2c083b934e78b3bd58a490ec6b092561954da6e7322e1e2b3c8abfddc0",
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
