import type { ImgHTMLAttributes } from "react";

export type TokenIconProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  title?: string;
};
