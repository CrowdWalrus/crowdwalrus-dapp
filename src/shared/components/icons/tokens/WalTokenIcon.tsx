import type { TokenIconProps } from "./types";

const WAL_ICON_SRC = "/assets/tokens/wal.png";

export function WalTokenIcon({ title, alt, ...props }: TokenIconProps) {
  return (
    <img
      src={WAL_ICON_SRC}
      alt={alt ?? title ?? ""}
      title={title}
      aria-hidden={title ? undefined : true}
      {...props}
    />
  );
}
