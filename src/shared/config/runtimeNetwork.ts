import type { SupportedNetwork } from "@/shared/types/network";

const MAINNET_HOSTS = new Set([
  "crowdwalrus.xyz",
  "www.crowdwalrus.xyz",
  "crowdwalrus.pages.dev",
]);

const TESTNET_HOSTS = new Set([
  "staging.crowdwalrus.xyz",
  "staging.crowdwalrus.pages.dev",
  "localhost",
  "127.0.0.1",
  "::1",
]);

const TESTNET_WAL_APP_SUFFIXES = [
  ".devnet.wal.app",
  ".testnet.wal.app",
];

function resolveHostname(explicitHostname?: string): string {
  if (explicitHostname) {
    return explicitHostname.toLowerCase();
  }

  if (typeof window === "undefined") {
    return "";
  }

  return window.location.hostname.toLowerCase();
}

/**
 * Resolve the active Sui network from runtime hostname.
 * This avoids runtime environment variables and works for Cloudflare Pages and Walrus Sites.
 */
export function resolveRuntimeNetwork(explicitHostname?: string): SupportedNetwork {
  const hostname = resolveHostname(explicitHostname);

  if (MAINNET_HOSTS.has(hostname)) {
    return "mainnet";
  }

  if (TESTNET_HOSTS.has(hostname)) {
    return "testnet";
  }

  // Preview deployments (hash.branch.project.pages.dev) should stay on testnet.
  if (hostname.endsWith(".pages.dev")) {
    return "testnet";
  }

  // Testnet/devnet Walrus portals.
  if (TESTNET_WAL_APP_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) {
    return "testnet";
  }

  // Mainnet Walrus portal.
  if (hostname.endsWith(".wal.app")) {
    return "mainnet";
  }

  return "testnet";
}
