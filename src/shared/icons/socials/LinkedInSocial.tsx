import { IconProps } from "@/shared/icons/types";

export default function LinkedInSocial({ size = 18, color = "#0C0F1C" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.001 6.55005C9.9181 5.61327 11.1121 5 12.501 5C15.5385 5 18.001 7.4624 18.001 10.5V18H16.001V10.5C16.001 8.567 14.434 7 12.501 7C10.568 7 9.001 8.567 9.001 10.5V18H7.001V5.5H9.001V6.55005ZM2.00098 3.5C1.17255 3.5 0.500977 2.82843 0.500977 2C0.500977 1.17157 1.17255 0.5 2.00098 0.5C2.8294 0.5 3.50098 1.17157 3.50098 2C3.50098 2.82843 2.8294 3.5 2.00098 3.5ZM1.00098 5.5H3.00098V18H1.00098V5.5Z"
        fill={color}
      />
    </svg>
  );
}
