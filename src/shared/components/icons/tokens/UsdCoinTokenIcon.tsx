import type { TokenIconProps } from "./types";

const USDC_ICON_SRC = "/assets/tokens/usdc.png";

export function UsdCoinTokenIcon({ title, alt, ...props }: TokenIconProps) {
  return (
    <img
      src={USDC_ICON_SRC}
      alt={alt ?? title ?? ""}
      title={title}
      aria-hidden={title ? undefined : true}
      {...props}
    />
  );
}
