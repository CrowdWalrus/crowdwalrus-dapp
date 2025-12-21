import { getTokenDisplayData } from "@/shared/config/tokenDisplay";
import { canonicalizeCoinType, isSuiCoinType } from "@/shared/utils/sui";
import type { DonationResponse } from "@/services/indexer-services";
import type { TokenRegistryEntry } from "@/services/tokenRegistry";

export type TokenInfo = {
  label: string;
  decimals: number;
  Icon?: ReturnType<typeof getTokenDisplayData>["Icon"];
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatContributionDate(timestampMs?: number | null): string {
  if (!timestampMs) return "—";
  return DATE_FORMATTER.format(new Date(timestampMs));
}

export { formatTokenAmount } from "@/shared/utils/currency";

export function resolveTokenInfo(
  donation: Pick<DonationResponse, "coinTypeCanonical" | "coinSymbol">,
  registry: Map<string, TokenRegistryEntry>,
): TokenInfo {
  const coinType = canonicalizeCoinType(donation.coinTypeCanonical);
  const token = registry.get(coinType);

  if (token) {
    const display = getTokenDisplayData(token);
    return {
      label: display.label,
      Icon: display.Icon,
      decimals: token.decimals,
    };
  }

  const fallbackSymbol = donation.coinSymbol || "Token";
  const display = getTokenDisplayData({
    coinType,
    symbol: fallbackSymbol,
    name: fallbackSymbol,
  });

  return {
    label: display.label,
    Icon: display.Icon,
    decimals: isSuiCoinType(coinType) ? 9 : 6,
  };
}
