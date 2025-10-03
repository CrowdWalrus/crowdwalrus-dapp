import { IconProps } from "@/shared/icons/types";

export default function FacebookSocial({ size = 11 }: IconProps) {
  const height = (size * 18) / 11;

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 11 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 7H10.5L10 9H6V18H4V9H0V7H4V5.12777C4 3.34473 4.1857 2.69816 4.5343 2.04631C4.8829 1.39446 5.3945 0.88288 6.0463 0.53427C6.6982 0.18565 7.3447 0 9.1278 0C9.6498 0 10.1072 0.0500001 10.5 0.15V2H9.1278C7.8041 2 7.401 2.07784 6.9895 2.29789C6.6862 2.46011 6.4601 2.68619 6.2979 2.98951C6.0778 3.40096 6 3.80407 6 5.12777V7Z"
        fill="currentColor"
      />
    </svg>
  );
}
