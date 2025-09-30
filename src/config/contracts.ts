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
  network: 'devnet' | 'testnet' | 'mainnet';
  uploadRelay?: string;
  aggregatorUrl: string;
  systemObjectId: string; // Walrus system object on Sui for pricing queries
}

/**
 * Complete network configuration
 */
export interface NetworkContractConfig {
  contracts: ContractAddresses;
  walrus: WalrusConfig;
  storageDefaults: {
    defaultEpochs: number;
    epochDurationDays: number;
  };
}

// ============================================================================
// DEVNET Configuration
// ============================================================================

const DEVNET_CONFIG: NetworkContractConfig = {
  contracts: {
    // TODO: Add your devnet package ID after deployment
    packageId: 'YOUR_DEVNET_PACKAGE_ID_HERE',

    // TODO: Add your CrowdWalrus shared object ID
    crowdWalrusObjectId: 'YOUR_DEVNET_CROWDWALRUS_OBJECT_ID_HERE',

    // TODO: Add SuiNS Manager object ID for devnet
    suinsManagerObjectId: 'YOUR_DEVNET_SUINS_MANAGER_OBJECT_ID_HERE',

    // TODO: Add SuiNS registry object ID for devnet
    suinsObjectId: 'YOUR_DEVNET_SUINS_OBJECT_ID_HERE',
  },
  walrus: {
    network: 'devnet',
    uploadRelay: 'https://relay.walrus.site',
    aggregatorUrl: 'https://aggregator.walrus.site/v1',
    // Devnet uses testnet system object
    systemObjectId: '0x98ebc47370603fe81d9e15491b2f1443d619d1dab720d586e429ed233e1255c1',
  },
  storageDefaults: {
    defaultEpochs: 100, // ~100 days on devnet (1 day per epoch)
    epochDurationDays: 1,
  },
};

// ============================================================================
// TESTNET Configuration
// ============================================================================

const TESTNET_CONFIG: NetworkContractConfig = {
  contracts: {
    // Package ID from deployment: 0x04bdca4b5d72638f99934eaf4afbb9d190d65302d29268d0b527748d0f74679f
    packageId: '0x04bdca4b5d72638f99934eaf4afbb9d190d65302d29268d0b527748d0f74679f',

    // CrowdWalrus shared object from deployment
    crowdWalrusObjectId: '0xf4e8ca077d99563a0829e67fc595264774a2c2f2b55085edcedaf46378779aab',

    // SuiNS Manager shared object from deployment
    suinsManagerObjectId: '0x57b7c3942b7e99e2ee9cc9e265caa98e1e35da9aa4a270bcd7ac1b54410ea8e3',

    // SuiNS registry object ID for testnet (official Sui object)
    suinsObjectId: '0xb120c0d55432630fce61f7854795a3463deb6e3b443cc4ae72e1282073ff56e4',
  },
  walrus: {
    network: 'testnet',
    uploadRelay: 'https://relay.walrus.site',
    aggregatorUrl: 'https://aggregator.walrus.site/v1',
    systemObjectId: '0x98ebc47370603fe81d9e15491b2f1443d619d1dab720d586e429ed233e1255c1',
  },
  storageDefaults: {
    defaultEpochs: 3, // Just 3 days for testing (1 day per epoch on testnet)
    epochDurationDays: 1,
  },
};

// ============================================================================
// MAINNET Configuration
// ============================================================================

const MAINNET_CONFIG: NetworkContractConfig = {
  contracts: {
    // TODO: Add your mainnet package ID after deployment
    packageId: 'YOUR_MAINNET_PACKAGE_ID_HERE',

    // TODO: Add your CrowdWalrus shared object ID
    crowdWalrusObjectId: 'YOUR_MAINNET_CROWDWALRUS_OBJECT_ID_HERE',

    // TODO: Add SuiNS Manager object ID for mainnet
    suinsManagerObjectId: 'YOUR_MAINNET_SUINS_MANAGER_OBJECT_ID_HERE',

    // TODO: Add SuiNS registry object ID for mainnet
    suinsObjectId: 'YOUR_MAINNET_SUINS_OBJECT_ID_HERE',
  },
  walrus: {
    network: 'mainnet',
    uploadRelay: 'https://relay.walrus.site',
    aggregatorUrl: 'https://aggregator.walrus.site/v1',
    systemObjectId: '0x2134d52768ea07e8c43570ef975eb3e4c27a39fa6396bef985b5abc58d03ddd2',
  },
  storageDefaults: {
    defaultEpochs: 100, // ~3.8 years on mainnet (14 days per epoch)
    epochDurationDays: 14,
  },
};

// ============================================================================
// Constants
// ============================================================================

/**
 * Sui Clock object - constant across all networks
 */
export const CLOCK_OBJECT_ID = '0x6';

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
  network: 'devnet' | 'testnet' | 'mainnet'
): NetworkContractConfig {
  switch (network) {
    case 'devnet':
      return DEVNET_CONFIG;
    case 'testnet':
      return TESTNET_CONFIG;
    case 'mainnet':
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