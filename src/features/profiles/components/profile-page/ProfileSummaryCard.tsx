import type { ReactNode } from "react";

import { Card, CardContent } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { cn } from "@/shared/lib/utils";

interface ProfileSummaryCardProps {
  addressLabel: string;
  description: string;
  action?: ReactNode;
  avatarLabel?: string;
  className?: string;
}

export function ProfileSummaryCard({
  addressLabel,
  description,
  action,
  avatarLabel = "0x.",
  className,
}: ProfileSummaryCardProps) {
  return (
    <Card className={cn("border-black-50 bg-white", className)}>
      <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
        <div className="flex w-full flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-black-50 text-4xl font-semibold text-black-500">
            {avatarLabel}
          </div>
          <div className="flex flex-1 flex-col gap-4 text-center sm:text-left">
            <div className="flex flex-col gap-2">
              <span className="text-3xl font-semibold tracking-tight text-black-500">
                {addressLabel}
              </span>
              <p className="text-base leading-relaxed text-black-400">
                {description}
              </p>
            </div>
            {action ? (
              <div className="flex flex-col gap-4">
                <Separator className="bg-white-600" />
                <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                  {action}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
