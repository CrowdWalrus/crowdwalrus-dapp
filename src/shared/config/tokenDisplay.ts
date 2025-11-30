import type { ComponentType } from "react";
import {
  BluefinTokenIcon,
  SuiTokenIcon,
  SuinsTokenIcon,
  TetherTokenIcon,
  UsdCoinTokenIcon,
  WalTokenIcon,
} from "@/shared/components/icons/tokens";
import type { TokenIconProps } from "@/shared/components/icons/tokens";
import { WAL_COIN_TYPE } from "@/shared/config/networkConfig";
import type { TokenRegistryEntry } from "@/services/tokenRegistry";

export type TokenIconComponent = ComponentType<TokenIconProps>;

const WAL_ICON_TYPES = Array.from(
  new Set([
    WAL_COIN_TYPE.testnet,
    WAL_COIN_TYPE.mainnet,
    WAL_COIN_TYPE.devnet,
  ]),
);

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
  "0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC":
    {
      Icon: UsdCoinTokenIcon,
    },
  USDC: {
    Icon: UsdCoinTokenIcon,
  },
  WAL: {
    Icon: WalTokenIcon,
  },
  USDT: {
    Icon: TetherTokenIcon,
  },
  TETHER: {
    Icon: TetherTokenIcon,
  },
  TETHER_USDT: {
    Icon: TetherTokenIcon,
  },
  SUINS: {
    Icon: SuinsTokenIcon,
  },
  NS: {
    Icon: SuinsTokenIcon,
  },
  BLUEFIN: {
    Icon: BluefinTokenIcon,
  },
  BLUE: {
    Icon: BluefinTokenIcon,
  },
  BFN: {
    Icon: BluefinTokenIcon,
  },
  ...WAL_ICON_TYPES.reduce<Record<string, TokenDisplayOverride>>(
    (acc, coinType) => {
      acc[coinType] = { Icon: WalTokenIcon };
      return acc;
    },
    {},
  ),
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
