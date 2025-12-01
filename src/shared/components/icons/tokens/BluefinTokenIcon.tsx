import type { TokenIconProps } from "./types";

const BLUEFIN_ICON_SRC = "/assets/tokens/bluefin.png";

export function BluefinTokenIcon({ title, alt, ...props }: TokenIconProps) {
  return (
    <img
      src={BLUEFIN_ICON_SRC}
      alt={alt ?? title ?? ""}
      title={title}
      aria-hidden={title ? undefined : true}
      {...props}
    />
  );
}
