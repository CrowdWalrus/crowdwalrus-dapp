import { IconProps } from "@/shared/icons/types";

export default function XSocial({ size = 22 }: IconProps) {
  const height = (size * 18) / 22;

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 22 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.4883 11.651L14.25 18H21.25L13.3917 7.5223L19.9308 0H17.2808L12.1643 5.88578L7.75 0H0.75L8.26086 10.0145L1.31915 18H3.96917L9.4883 11.651ZM15.25 16L4.75 2H6.75L17.25 16H15.25Z"
        fill="currentColor"
      />
    </svg>
  );
}
