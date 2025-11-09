import { useMemo } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { getContractConfig } from "@/shared/config/contracts";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";
import {
  fetchTokenRegistryEntries,
  type TokenRegistryEntry,
} from "@/services/tokenRegistry";

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

export function useEnabledTokens(
  options: UseEnabledTokensOptions = {},
) {
  const {
    network = DEFAULT_NETWORK,
    includeDisabled = false,
    enabled: isHookEnabled = true,
  } = options;

  const suiClient = useSuiClient();
  const config = getContractConfig(network);
  const registryId = config.contracts.tokenRegistryObjectId;

  const query = useQuery<TokenRegistryEntry[], Error>({
    queryKey: ["token-registry", network, registryId],
    queryFn: () => fetchTokenRegistryEntries(suiClient, registryId),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: Boolean(isHookEnabled && registryId),
  });

  const allTokens = useMemo(() => query.data ?? [], [query.data]);
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
