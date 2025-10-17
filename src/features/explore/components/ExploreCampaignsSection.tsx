/**
 * Explore Campaigns Section
 *
 * Main section displaying campaigns with filters and tabs
 */

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { useMyCampaigns } from "@/features/campaigns/hooks/useMyCampaigns";
import { CampaignCard } from "./CampaignCard";
import { getCampaignStatus } from "@/features/campaigns/utils/campaignStatus";
import { ChevronDown } from "lucide-react";

type TabFilter = "all" | "open_soon" | "funding" | "active" | "ended";

interface TabConfig {
  id: TabFilter;
  label: string;
}

const TABS: TabConfig[] = [
  { id: "all", label: "All" },
  { id: "open_soon", label: "Open soon" },
  { id: "funding", label: "Funding" },
  { id: "active", label: "Active" },
  { id: "ended", label: "Ended" },
];

// Mock data for raised amounts and supporters (will be replaced with real data later)
const MOCK_CAMPAIGN_DATA: Record<
  string,
  { raised: number; supporters: number }
> = {};

function generateMockData(campaignId: string) {
  if (!MOCK_CAMPAIGN_DATA[campaignId]) {
    // Generate consistent mock data based on campaign ID
    const hash = campaignId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    MOCK_CAMPAIGN_DATA[campaignId] = {
      raised: Math.floor((hash % 100) * 1000) + 10000,
      supporters: Math.floor((hash % 50) * 10) + 100,
    };
  }
  return MOCK_CAMPAIGN_DATA[campaignId];
}

export function ExploreCampaignsSection() {
  const [displayCounts, setDisplayCounts] = useState<Record<TabFilter, number>>(
    {
      all: 6,
      open_soon: 6,
      funding: 6,
      active: 6,
      ended: 6,
    },
  );

  const { campaigns, isPending, error } = useMyCampaigns();

  // Helper function to filter campaigns by tab
  const getFilteredCampaigns = (filter: TabFilter) => {
    return campaigns.filter((campaign) => {
      if (filter === "all") return true;

      const status = getCampaignStatus(
        campaign.startDateMs,
        campaign.endDateMs,
        campaign.isActive,
        campaign.isDeleted,
      );

      return status === filter;
    });
  };

  const handleShowMore = (filter: TabFilter) => {
    setDisplayCounts((prev) => ({
      ...prev,
      [filter]: prev[filter] + 6,
    }));
  };

  return (
    <div className="w-full">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-[100px] py-[100px]">
          {/* Section Header */}
          <div className="flex items-center gap-10">
            <h2 className="font-semibold text-[32px] text-black-500 tracking-[0.32px] whitespace-nowrap">
              Explore Campaigns
            </h2>
            <Separator className="flex-1 bg-border" />
          </div>

          {/* Tabs and Content */}
          <Tabs defaultValue="all" className="w-full">
            <div className="flex items-center justify-between pb-10">
              {/* Tabs List */}
              <TabsList className="bg-white-500 rounded-xl p-1">
                {TABS.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Filters Button */}
              {/* <Button
                variant="outline"
                className="flex items-center gap-2 border-black-50"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
              </Button> */}
            </div>

            {/* Tab Content for each filter */}
            {TABS.map((tab) => {
              const filteredCampaigns = getFilteredCampaigns(tab.id);
              const displayCount = displayCounts[tab.id];
              const displayedCampaigns = filteredCampaigns.slice(
                0,
                displayCount,
              );
              const hasMore = filteredCampaigns.length > displayCount;

              return (
                <TabsContent key={tab.id} value={tab.id} className="mt-20">
                  <div className="flex flex-col gap-20">
                    {/* Campaign Cards Grid */}
                    {isPending ? (
                      <div className="flex items-center justify-center py-20">
                        <p className="text-black-300">Loading campaigns...</p>
                      </div>
                    ) : error ? (
                      <div className="flex items-center justify-center py-20">
                        <p className="text-red-500">
                          Error loading campaigns: {error.message}
                        </p>
                      </div>
                    ) : displayedCampaigns.length === 0 ? (
                      <div className="flex items-center justify-center py-20">
                        <p className="text-black-300">
                          No campaigns found for this filter.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {displayedCampaigns.map((campaign) => {
                          const mockData = generateMockData(campaign.id);
                          return (
                            <CampaignCard
                              key={campaign.id}
                              campaign={campaign}
                              raised={mockData.raised}
                              supporters={mockData.supporters}
                            />
                          );
                        })}
                      </div>
                    )}

                    {/* Show More Button */}
                    {hasMore && (
                      <div className="flex justify-center">
                        <Button
                          onClick={() => handleShowMore(tab.id)}
                          className="flex items-center gap-2 bg-blue-50 text-blue-500 hover:bg-blue-100 px-6"
                        >
                          <span>Show more</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
