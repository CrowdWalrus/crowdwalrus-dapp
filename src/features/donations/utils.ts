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

function groupWithCommas(value: bigint): string {
  const sign = value < 0n ? "-" : "";
  const digits = (value < 0n ? -value : value).toString();
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatTokenAmount(rawAmount: bigint, decimals: number): string {
  if (rawAmount === 0n) return "0";
  const safeDecimals = Math.max(decimals, 0);
  const scale = 10n ** BigInt(safeDecimals);
  const whole = rawAmount / scale;
  const remainder = rawAmount % scale;

  let roundedFraction = (remainder * 100n + scale / 2n) / scale;
  let adjustedWhole = whole;
  if (roundedFraction === 100n) {
    adjustedWhole += 1n;
    roundedFraction = 0n;
  }

  const fractionStr = roundedFraction
    .toString()
    .padStart(2, "0")
    .replace(/0+$/, "");

  return fractionStr
    ? `${groupWithCommas(adjustedWhole)}.${fractionStr}`
    : groupWithCommas(adjustedWhole);
}

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
