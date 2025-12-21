import { SUI_EXPLORER_URLS } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";

export function resolveExplorerBaseUrl(network: SupportedNetwork): string {
  return SUI_EXPLORER_URLS[network] ?? SUI_EXPLORER_URLS.testnet;
}

export function buildExplorerTxUrl(
  digest: string | null | undefined,
  network: SupportedNetwork,
): string | null {
  if (!digest) return null;
  const baseUrl = resolveExplorerBaseUrl(network);
  return `${baseUrl}/txblock/${digest}`;
}
