import type { SupportedNetwork } from "@/shared/types/network";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";

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
    uploadRelay: "https://upload-relay.testnet.walrus.space",
    aggregatorUrl: "https://aggregator.walrus-testnet.walrus.space/v1",
    // Devnet uses testnet system object
    systemObjectId:
      "0x6c2547cbbc38025cf3adac45f63cb0a8d12ecf777cdc75a4971612bf97fdf6af",
    // No subsidy object configured for devnet/testnet environments
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
      "0x428ec1774457c593220968ae69c6c0493397ff0250929d09b5ad0ac51ac50d6e",

    // CrowdWalrus shared object from deployment
    crowdWalrusObjectId:
      "0x383653c211c606ac869de3e4756d4ca00e1334df4d3e06d271600de23533b1c5",

    // SuiNS Manager shared object from deployment
    suinsManagerObjectId:
      "0xd35e7e0af51662cc07dced530c868be4b40a9396d8dcdd3847c50f5a10f061fa",

    // SuiNS registry object ID for custom deployment (crowdwalrus-testnet-core-v2)
    suinsObjectId:
      "0x300369e8909b9a6464da265b9a5a9ab6fe2158a040e84e808628cde7a07ee5a3",

    // PolicyRegistry shared object from Phase 2 deployment
    policyRegistryObjectId:
      "0x85b6a872bb08b82f6c2da4e32de00cd2910d6262281c57e3a06de51c7427ba27",

    // ProfilesRegistry shared object from Phase 2 deployment
    profilesRegistryObjectId:
      "0xe48a80faa1b6fefcae03cb9770ea9b73027f63b492fbe213c3f179b41186d336",

    // TokenRegistry shared object from Phase 2 deployment
    tokenRegistryObjectId:
      "0xc39c14642b913e5129035ef427cb9b2393cd1ff29c75c957af65b308d89239d7",

    // BadgeConfig shared object from Phase 2 deployment
    badgeConfigObjectId:
      "0x75a2acf943d40bcd3385fbbf0b627cf23cd1278be36c1f6b509638b4d1625e1a",
  },
  walrus: {
    network: "testnet",
    uploadRelay: "https://upload-relay.testnet.walrus.space",
    aggregatorUrl: "https://aggregator.walrus-testnet.walrus.space/v1",
    systemObjectId:
      "0x6c2547cbbc38025cf3adac45f63cb0a8d12ecf777cdc75a4971612bf97fdf6af",
    // No subsidy object configured for testnet
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
    packageId:
      "0x035cf7b699be1d67785cc54dabc83e497fae23516c0329bea39faabf3384f702",

    crowdWalrusObjectId:
      "0x95084b96d2f27283fd91db36166d96c477a02d8d76317655b6ba04cfa24e94a0",

    suinsManagerObjectId:
      "0xd71de83cc6a3a1f266b7b1dddb751b3b268ec9cd741e759f827e5fab10d6890e",

    suinsObjectId:
      "0x6e0ddefc0ad98889c04bab9639e512c21766c5e6366f89e696956d9be6952871",

    policyRegistryObjectId:
      "0xb9478cb0359b4a9a6a86b4e9ca2f6a171b7b6405f8ffada12b1f45d68077897c",

    profilesRegistryObjectId:
      "0xd95e1968dcbf42ea0eccb1184ec9c529bbc7b7651b046a7d9247903b14869501",

    tokenRegistryObjectId:
      "0x9409e01b8bafbad0b89e949bcfb8416be7f600f4b87df3bc4103e6f5d78cfb00",

    badgeConfigObjectId:
      "0xdbbc3ed362df0a25b68d62bdcb237c8ea7eb2c109228de69a575dd15a77de43e",
  },
  walrus: {
    network: "mainnet",
    uploadRelay: "https://upload-relay.mainnet.walrus.space",
    aggregatorUrl: "https://aggregator.walrus-mainnet.walrus.space/v1",
    systemObjectId:
      "0x2134d52768ea07e8c43570ef975eb3e4c27a39fa6396bef985b5abc58d03ddd2",
    subsidyObjectId:
      "0xb606eb177899edc2130c93bf65985af7ec959a2755dc126c953755e59324209e",
  },
  campaignDomain: "crowdwalrus.sui",
  pyth: {
    hermesUrl: "https://hermes.pyth.network",
    pythStateId:
      "0x1f9310238ee9298fb703c3419030b35b22bb1cc37113e3bb5007c99aec79e5b8",
    wormholeStateId:
      "0xaeab97f96cf9877fee2883315d459552b2b921edc16d7ceac6eab944dd88919c",
  },
};

// ============================================================================
// Constants
// ============================================================================

/**
 * Sui Clock object - constant across all networks
 */
export const CLOCK_OBJECT_ID = SUI_CLOCK_OBJECT_ID;

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
