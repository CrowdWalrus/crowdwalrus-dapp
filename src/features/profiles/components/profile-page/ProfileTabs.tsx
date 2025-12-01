import type { ReactNode } from "react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { cn } from "@/shared/lib/utils";

export type ProfileTabValue = "overview" | "campaigns" | "contributions";

export interface ProfileTabConfig {
  value: ProfileTabValue;
  label: string;
  badgeCount?: number;
  content: ReactNode;
  disabled?: boolean;
}

interface ProfileTabsProps {
  tabs: ProfileTabConfig[];
  value?: ProfileTabValue;
  defaultValue?: ProfileTabValue;
  onValueChange?: (value: ProfileTabValue) => void;
  className?: string;
}

export function ProfileTabs({
  tabs,
  value,
  defaultValue,
  onValueChange,
  className,
}: ProfileTabsProps) {
  if (!tabs.length) {
    return null;
  }

  const firstValue = tabs[0]?.value;
  const resolvedDefault = defaultValue ?? firstValue;
  const handleValueChange = (nextValue: string) => {
    if (onValueChange) {
      onValueChange(nextValue as ProfileTabValue);
    }
  };

  return (
    <Tabs
      className={className}
      value={value}
      defaultValue={resolvedDefault}
      onValueChange={handleValueChange}
    >
      <div className="flex justify-center">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-xl bg-white-500 p-1 shadow-sm">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              disabled={tab.disabled}
              className={cn(
                "flex items-center gap-2 rounded-xl p-2 text-sm font-medium text-black-300 transition",
                "data-[state=active]:bg-white data-[state=active]:text-black-500 data-[state=active]:shadow-sm",
                "data-[state=active]:shadow-[0_1px_3px_rgba(12,15,28,0.12),0_1px_2px_rgba(12,15,28,0.08)]",
              )}
            >
              <span className="text-sm font-medium text-black-300">
                {tab.label}
              </span>
              {typeof tab.badgeCount === "number" ? (
                <span className="inline-flex h-5 min-w-[24px] items-center justify-center rounded-xl bg-gray-200 px-2 text-xs font-semibold text-black-400">
                  {tab.badgeCount}
                </span>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="pt-10">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
