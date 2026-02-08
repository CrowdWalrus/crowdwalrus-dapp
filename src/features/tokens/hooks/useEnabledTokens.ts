import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";
import { fetchTokenRegistryEntries, type TokenRegistryEntry } from "@/services/tokenRegistry";
import { isSuiCoinType } from "@/shared/utils/sui";

export interface UseEnabledTokensOptions {
  network?: SupportedNetwork;
  /**
   * Whether to include disabled tokens in the returned data. Defaults to false.
   */
  includeDisabled?: boolean;
  /**
   * Optional switch to defer the query until upstream state is ready.
   */
  enabled?: boolean;
}

export type EnabledToken = TokenRegistryEntry;

const TOKEN_PRIORITY_ORDER = ["SUI", "USDC", "WAL", "BLUE", "NS"] as const;

type PriorityToken = (typeof TOKEN_PRIORITY_ORDER)[number];

const TOKEN_PRIORITY_RANK = new Map<PriorityToken, number>(
  TOKEN_PRIORITY_ORDER.map((token, index) => [token, index]),
);

const TOKEN_PRIORITY_ALIASES: Record<string, PriorityToken> = {
  SUI: "SUI",
  USDC: "USDC",
  WAL: "WAL",
  BLUE: "BLUE",
  BLUEFIN: "BLUE",
  BFN: "BLUE",
  NS: "NS",
  SUINS: "NS",
};

function resolvePriorityToken(
  token: Pick<TokenRegistryEntry, "coinType" | "symbol" | "name">,
): PriorityToken | null {
  if (isSuiCoinType(token.coinType)) {
    return "SUI";
  }

  const normalizedSymbol = token.symbol.trim().toUpperCase();
  const fromSymbol = TOKEN_PRIORITY_ALIASES[normalizedSymbol];
  if (fromSymbol) {
    return fromSymbol;
  }

  const normalizedName = token.name.trim().toUpperCase();
  const fromName = TOKEN_PRIORITY_ALIASES[normalizedName];
  if (fromName) {
    return fromName;
  }

  const normalizedCoinType = token.coinType.toLowerCase();
  if (normalizedCoinType.includes("::usdc::")) {
    return "USDC";
  }
  if (normalizedCoinType.includes("::wal::")) {
    return "WAL";
  }
  if (
    normalizedCoinType.includes("::blue::") ||
    normalizedCoinType.includes("::bluefin::")
  ) {
    return "BLUE";
  }
  if (
    normalizedCoinType.includes("::ns::") ||
    normalizedCoinType.includes("::suins::")
  ) {
    return "NS";
  }

  return null;
}

function resolveTokenPriority(
  token: Pick<TokenRegistryEntry, "coinType" | "symbol" | "name">,
): number {
  const priorityToken = resolvePriorityToken(token);
  if (!priorityToken) {
    return Number.MAX_SAFE_INTEGER;
  }
  return TOKEN_PRIORITY_RANK.get(priorityToken) ?? Number.MAX_SAFE_INTEGER;
}

function sortTokenRegistryEntries(tokens: TokenRegistryEntry[]) {
  return [...tokens].sort((left, right) => {
    if (left.isEnabled !== right.isEnabled) {
      return left.isEnabled ? -1 : 1;
    }

    const leftPriority = resolveTokenPriority(left);
    const rightPriority = resolveTokenPriority(right);
    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    const leftLabel = (left.symbol || left.name || left.coinType).toUpperCase();
    const rightLabel = (right.symbol || right.name || right.coinType).toUpperCase();
    const labelOrder = leftLabel.localeCompare(rightLabel);
    if (labelOrder !== 0) {
      return labelOrder;
    }

    return left.coinType.localeCompare(right.coinType);
  });
}

export function useEnabledTokens(
  options: UseEnabledTokensOptions = {},
) {
  const {
    network = DEFAULT_NETWORK,
    includeDisabled = false,
    enabled: isHookEnabled = true,
  } = options;

  const query = useQuery<TokenRegistryEntry[], Error>({
    queryKey: ["token-registry", network],
    queryFn: () => fetchTokenRegistryEntries(),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: Boolean(isHookEnabled),
  });

  const allTokens = useMemo(
    () => sortTokenRegistryEntries(query.data ?? []),
    [query.data],
  );
  const enabledTokens = useMemo(
    () =>
      includeDisabled
        ? allTokens
        : allTokens.filter((token) => token.isEnabled),
    [allTokens, includeDisabled],
  );

  const enabledCoinTypes = useMemo(
    () => enabledTokens.map((token) => token.coinType),
    [enabledTokens],
  );

  return {
    ...query,
    data: enabledTokens,
    tokens: enabledTokens,
    enabledTokens,
    enabledCoinTypes,
    allTokens,
  };
}
