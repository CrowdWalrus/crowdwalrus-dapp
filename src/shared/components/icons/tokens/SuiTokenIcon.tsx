import type { TokenIconProps } from "./types";

const SUI_ICON_SRC = "/assets/tokens/sui.png";

export function SuiTokenIcon({ title, alt, ...props }: TokenIconProps) {
  return (
    <img
      src={SUI_ICON_SRC}
      alt={alt ?? title ?? ""}
      title={title}
      aria-hidden={title ? undefined : true}
      {...props}
    />
  );
}
