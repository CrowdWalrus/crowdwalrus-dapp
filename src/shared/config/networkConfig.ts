import { getFullnodeUrl } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";

/**
 * Default network for the application
 * Change this single value to switch between testnet and mainnet
 */
export const DEFAULT_NETWORK = "testnet" as const;

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

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    devnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        walCoinType: WAL_COIN_TYPE.devnet,
      },
    },
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        walCoinType: WAL_COIN_TYPE.testnet,
      },
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
      variables: {
        walCoinType: WAL_COIN_TYPE.mainnet,
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
