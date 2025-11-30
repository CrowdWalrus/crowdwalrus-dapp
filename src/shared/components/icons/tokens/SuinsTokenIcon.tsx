import type { TokenIconProps } from "./types";

const SUINS_ICON_SRC = "/assets/tokens/suins.png";

export function SuinsTokenIcon({ title, alt, ...props }: TokenIconProps) {
  return (
    <img
      src={SUINS_ICON_SRC}
      alt={alt ?? title ?? ""}
      title={title}
      aria-hidden={title ? undefined : true}
      {...props}
    />
  );
}
