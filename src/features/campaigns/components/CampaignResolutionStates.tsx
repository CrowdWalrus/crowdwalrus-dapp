import type { ReactNode } from "react";

import { isValidSuiObjectId } from "@mysten/sui/utils";

import { Card, CardContent } from "@/shared/components/ui/card";

interface ResolutionLayoutProps {
  children: ReactNode;
  variant?: "default" | "error" | "warning";
}

const variantClasses: Record<Required<ResolutionLayoutProps>["variant"], string> = {
  default: "",
  error: "border-red-500",
  warning: "border-yellow-500",
};

const ResolutionLayout = ({ children, variant = "default" }: ResolutionLayoutProps) => (
  <div className="py-8">
    <div className="container px-4 max-w-4xl">
      <Card className={variantClasses[variant]}>
        <CardContent className="pt-6">{children}</CardContent>
      </Card>
    </div>
  </div>
);

export const CampaignResolutionLoading = () => (
  <ResolutionLayout>
    <p className="text-muted-foreground">Resolving campaign address...</p>
  </ResolutionLayout>
);

interface CampaignResolutionErrorProps {
  error: Error;
}

export const CampaignResolutionError = ({ error }: CampaignResolutionErrorProps) => (
  <ResolutionLayout variant="error">
    <p className="text-red-600 font-semibold mb-2">Failed to resolve campaign address</p>
    <p className="text-sm text-muted-foreground">{error.message}</p>
  </ResolutionLayout>
);

interface CampaignResolutionNotFoundProps {
  identifier: string;
  label?: string;
}

export const CampaignResolutionNotFound = ({
  identifier,
  label,
}: CampaignResolutionNotFoundProps) => {
  const computedLabel = label ?? (isValidSuiObjectId(identifier) ? "Campaign ID" : "Campaign subdomain");

  return (
    <ResolutionLayout variant="warning">
      <p className="text-yellow-600 font-semibold">Campaign not found</p>
      <p className="text-sm text-muted-foreground mt-2">
        {computedLabel}: {identifier || "Unknown"}
      </p>
    </ResolutionLayout>
  );
};

export const CampaignResolutionMissing = () => (
  <ResolutionLayout variant="error">
    <p className="text-red-600 font-semibold mb-2">Campaign reference missing</p>
    <p className="text-sm text-muted-foreground">
      Please navigate to this page with a valid campaign identifier.
    </p>
  </ResolutionLayout>
);
