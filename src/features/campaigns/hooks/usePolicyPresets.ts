import { useMemo } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";
import { getContractConfig } from "@/shared/config/contracts";
import {
  POLICY_PRESET_ORDER,
  type PolicyPresetName,
  getPolicyDisplayCopy,
  buildFallbackPolicyPresets,
} from "@/features/campaigns/constants/policies";
import { fetchPolicyPresetsFromRegistry } from "@/services/policyRegistry";

export interface PolicyPresetOption {
  name: PolicyPresetName;
  label: string;
  description: string;
  platformBps: number;
  platformAddress: string;
}

const FALLBACK_PRESETS = buildFallbackPolicyPresets();

export function usePolicyPresets(
  network: SupportedNetwork = DEFAULT_NETWORK,
) {
  const suiClient = useSuiClient();
  const config = getContractConfig(network);
  const policyRegistryId = config.contracts.policyRegistryObjectId;

  const query = useQuery({
    queryKey: ["policy-presets", policyRegistryId],
    queryFn: async () => {
      const presets = await fetchPolicyPresetsFromRegistry(
        suiClient,
        policyRegistryId,
      );
      return presets.map((preset) => {
        const copy = getPolicyDisplayCopy(
          preset.name,
          preset.platformBps,
        );
        return {
          name: preset.name,
          label: copy.label,
          description: copy.description,
          platformBps: preset.platformBps,
          platformAddress: preset.platformAddress,
        } satisfies PolicyPresetOption;
      });
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const data = useMemo(() => {
    if (query.data && query.data.length > 0) {
      return sortPresets(query.data);
    }
    return FALLBACK_PRESETS;
  }, [query.data]);

  return {
    ...query,
    data,
  };
}

function sortPresets(presets: PolicyPresetOption[]) {
  const order = new Map(POLICY_PRESET_ORDER.map((name, index) => [name, index]));
  return [...presets].sort((a, b) => {
    const orderA = order.get(a.name) ?? Number.MAX_SAFE_INTEGER;
    const orderB = order.get(b.name) ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.name.localeCompare(b.name);
  });
}
