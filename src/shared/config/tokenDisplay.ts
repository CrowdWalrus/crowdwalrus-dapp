import type { ComponentType, SVGProps } from "react";
import { SuiTokenIcon, UsdCoinTokenIcon } from "@/shared/components/icons/tokens";
import type { TokenRegistryEntry } from "@/services/tokenRegistry";

export type TokenIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export interface TokenDisplayData {
  label: string;
  Icon?: TokenIconComponent;
}

type TokenDisplayOverride = {
  label?: string;
  Icon?: TokenIconComponent;
};

// Only override the pieces we cannot derive from on-chain metadata (e.g. icons).
const TOKEN_DISPLAY_OVERRIDES: Record<string, TokenDisplayOverride> = {
  "0x2::sui::SUI": {
    Icon: SuiTokenIcon,
  },
  SUI: {
    Icon: SuiTokenIcon,
  },
  "0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC": {
    Icon: UsdCoinTokenIcon,
  },
  USDC: {
    Icon: UsdCoinTokenIcon,
  },
};

export function getTokenDisplayData(
  token: Pick<TokenRegistryEntry, "coinType" | "symbol" | "name">,
): TokenDisplayData {
  const symbolKey = token.symbol?.toUpperCase();
  const override =
    TOKEN_DISPLAY_OVERRIDES[token.coinType] ??
    (symbolKey ? TOKEN_DISPLAY_OVERRIDES[symbolKey] : null);

  return {
    label: override?.label ?? token.symbol ?? token.name ?? "Token",
    Icon: override?.Icon,
  };
}

export function registerTokenDisplayConfig(
  key: string,
  config: TokenDisplayOverride,
) {
  TOKEN_DISPLAY_OVERRIDES[key] = config;
}
