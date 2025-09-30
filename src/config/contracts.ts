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
    // TODO: Add your testnet package ID after deployment
    packageId: 'YOUR_TESTNET_PACKAGE_ID_HERE',

    // TODO: Add your CrowdWalrus shared object ID
    crowdWalrusObjectId: 'YOUR_TESTNET_CROWDWALRUS_OBJECT_ID_HERE',

    // TODO: Add SuiNS Manager object ID for testnet
    suinsManagerObjectId: 'YOUR_TESTNET_SUINS_MANAGER_OBJECT_ID_HERE',

    // TODO: Add SuiNS registry object ID for testnet
    suinsObjectId: 'YOUR_TESTNET_SUINS_OBJECT_ID_HERE',
  },
  walrus: {
    network: 'testnet',
    uploadRelay: 'https://relay.walrus.site',
    aggregatorUrl: 'https://aggregator.walrus.site/v1',
    systemObjectId: '0x98ebc47370603fe81d9e15491b2f1443d619d1dab720d586e429ed233e1255c1',
  },
  storageDefaults: {
    defaultEpochs: 100, // ~100 days on testnet (1 day per epoch)
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