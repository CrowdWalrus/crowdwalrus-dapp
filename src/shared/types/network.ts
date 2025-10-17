export const SUPPORTED_NETWORKS = ["devnet", "testnet", "mainnet"] as const;

export type SupportedNetwork = (typeof SUPPORTED_NETWORKS)[number];
