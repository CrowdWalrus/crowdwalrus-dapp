import { cn } from "@/shared/lib/utils";

export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: "sm" | "md" | "lg";
  /** Optional className for additional styling */
  className?: string;
}

const sizeClasses = {
  sm: "size-6 border-2",
  md: "size-12 border-4",
  lg: "size-16 border-4",
};

export const LoadingSpinner = ({
  size = "md",
  className,
}: LoadingSpinnerProps) => {
  return (
    <div
      className={cn(
        "border-primary border-t-transparent rounded-full animate-spin",
        sizeClasses[size],
        className
      )}
    />
  );
};
