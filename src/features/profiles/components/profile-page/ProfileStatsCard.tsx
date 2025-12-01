import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";

export interface ProfileStat {
  id: string;
  label: string;
  value: string;
  icon: LucideIcon;
  iconClassName?: string;
}

interface ProfileStatsCardProps {
  stats: ProfileStat[];
}

export function ProfileStatsCard({ stats }: ProfileStatsCardProps) {
  if (!stats.length) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {stats.map((stat) => (
        <Card
          key={stat.id}
          className="border-black-50 bg-white shadow-sm shadow-black/5"
        >
          <CardContent className="flex items-start gap-4 px-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-primary">
              <stat.icon
                className={cn("h-6 w-6", stat.iconClassName)}
                strokeWidth={2}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium uppercase tracking-wide text-black-300">
                {stat.label}
              </span>
              <span className="text-2xl font-semibold tracking-tight text-black-500">
                {stat.value}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
