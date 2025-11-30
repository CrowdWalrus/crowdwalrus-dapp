import type { TokenIconProps } from "./types";

const TETHER_ICON_SRC = "/assets/tokens/tether.png";

export function TetherTokenIcon({ title, alt, ...props }: TokenIconProps) {
  return (
    <img
      src={TETHER_ICON_SRC}
      alt={alt ?? title ?? ""}
      title={title}
      aria-hidden={title ? undefined : true}
      {...props}
    />
  );
}
