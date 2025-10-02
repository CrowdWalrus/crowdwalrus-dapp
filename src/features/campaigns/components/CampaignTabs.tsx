/**
 * Campaign Tabs Component
 * Tabbed navigation for campaign sections
 */

import { useState } from "react";

type TabValue = "about" | "contributions" | "updates";

interface CampaignTabsProps {
  defaultTab?: TabValue;
  onTabChange?: (tab: TabValue) => void;
}

export function CampaignTabs({
  defaultTab = "about",
  onTabChange,
}: CampaignTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>(defaultTab);

  const handleTabClick = (tab: TabValue) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  return (
    <div className="bg-[#f7f7f7] rounded-[12px] p-1 flex items-center gap-0 w-fit">
      <button
        onClick={() => handleTabClick("about")}
        className={` text-sm font-medium leading-[1.5] tracking-[0.07px] px-2.5 py-1.5 rounded-[10px] min-h-8 transition-all ${
          activeTab === "about"
            ? "bg-white text-[#0c0f1c] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
            : "text-[#5c5e67]"
        }`}
      >
        About
      </button>
      <button
        onClick={() => handleTabClick("contributions")}
        className={` text-sm font-medium leading-[1.5] tracking-[0.07px] px-2.5 py-1.5 rounded-[10px] min-h-8 transition-all ${
          activeTab === "contributions"
            ? "bg-white text-[#0c0f1c] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
            : "text-[#5c5e67]"
        }`}
      >
        Contributions
      </button>
      <button
        onClick={() => handleTabClick("updates")}
        className={` text-sm font-medium leading-[1.5] tracking-[0.07px] px-2.5 py-1.5 rounded-[10px] min-h-8 transition-all ${
          activeTab === "updates"
            ? "bg-white text-[#0c0f1c] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
            : "text-[#5c5e67]"
        }`}
      >
        Updates
      </button>
    </div>
  );
}
