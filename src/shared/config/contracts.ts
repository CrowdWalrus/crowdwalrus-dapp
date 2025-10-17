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
export interface NetworkContractConfig {
  contracts: ContractAddresses;
  walrus: WalrusConfig;
  campaignDomain: string;
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
};

// ============================================================================
// TESTNET Configuration
// ============================================================================

const TESTNET_CONFIG: NetworkContractConfig = {
  contracts: {
    // Package ID from deployment
    packageId:
      "0x7c0e35909394908e79505a301860db084fa0a0d2eace8496528da995e7de3a64",

    // CrowdWalrus shared object from deployment
    crowdWalrusObjectId:
      "0xf7f40450c3d5adabac7232e97320039bd94f19b8c3b664c90893b514cac4226f",

    // SuiNS Manager shared object from deployment
    suinsManagerObjectId:
      "0x8a0b7028dcff9b0a263971caad0716cd8f295f2fc830ef72e1c0f68a42675c01",

    // SuiNS registry object ID for custom deployment (crowdwalrus-testnet-core-v2)
    suinsObjectId:
      "0x300369e8909b9a6464da265b9a5a9ab6fe2158a040e84e808628cde7a07ee5a3",
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
