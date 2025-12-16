import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, HandHeart } from "lucide-react";

import { useAllCampaigns } from "@/features/campaigns/hooks/useAllCampaigns";
import { Button } from "@/shared/components/ui/button";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import { ROUTES } from "@/shared/config/routes";
import { HomeDiscoverCampaignCardLarge } from "./discover-campaigns/HomeDiscoverCampaignCardLarge";
import { HomeDiscoverCampaignCardSmall } from "./discover-campaigns/HomeDiscoverCampaignCardSmall";

export function HomeDiscoverCampaignsSection() {
  const { campaigns, isPending, error } = useAllCampaigns(DEFAULT_NETWORK, {
    pageSize: 20,
    verified: false,
  });

  const visibleCampaigns = useMemo(
    () => campaigns.filter((campaign) => !campaign.isDeleted).slice(0, 5),
    [campaigns],
  );

  const filledCampaigns = useMemo(() => {
    if (visibleCampaigns.length === 0) {
      return [];
    }

    if (visibleCampaigns.length >= 5) {
      return visibleCampaigns.slice(0, 5);
    }

    return Array.from({ length: 5 }, (_, idx) => {
      const campaign = visibleCampaigns[idx % visibleCampaigns.length];
      return campaign;
    });
  }, [visibleCampaigns]);

  const [primaryCampaign, ...secondaryCampaigns] = filledCampaigns;

  return (
    <section className="bg-white-50">
      <div className="container px-4">
        <div className="flex flex-col items-center gap-20 py-[100px]">
          {/* Header */}
          <div className="flex w-full max-w-[1000px] flex-col gap-4 text-center">
            <h2 className="text-4xl font-semibold leading-[1.2] tracking-[0.48px] text-black-500 sm:text-5xl">
              Discover Campaigns
            </h2>
            <p className="text-lg leading-[1.6] text-black-400 sm:text-xl">
              Explore verified and community campaigns across causes, creators,
              and startups—each with transparent progress and real-time
              contribution tracking.
            </p>
          </div>

          {/* Grid */}
          <div className="w-full rounded-[40px] bg-white-400 p-6 sm:p-8 lg:h-[800px] lg:p-10">
            {isPending ? (
              <div className="flex h-full items-center justify-center py-20">
                <p className="text-black-300">Loading campaigns...</p>
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center py-20">
                <p className="text-red-500">
                  Error loading campaigns: {error.message}
                </p>
              </div>
            ) : !primaryCampaign ? (
              <div className="flex h-full items-center justify-center py-20">
                <p className="text-black-300">No campaigns available.</p>
              </div>
            ) : (
              <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-4 lg:grid-rows-2">
                <div className="lg:col-span-2 lg:row-span-2">
                  <HomeDiscoverCampaignCardLarge campaign={primaryCampaign} />
                </div>

                {secondaryCampaigns.slice(0, 4).map((campaign, idx) => (
                  <div key={`${campaign.id}-${idx}`} className="min-h-[240px]">
                    <HomeDiscoverCampaignCardSmall campaign={campaign} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CTAs */}
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Button
              asChild
              className="min-h-10 rounded-lg bg-blue-50 px-6 text-blue-500 shadow-none hover:bg-blue-100 [&_svg]:size-4"
            >
              <Link to={ROUTES.EXPLORE}>
                Contribute
                <HandHeart />
              </Link>
            </Button>

            <Button
              asChild
              className="min-h-10 rounded-lg bg-blue-500 px-6 text-white-50 shadow-none hover:bg-blue-600 [&_svg]:size-4"
            >
              <Link to={ROUTES.CAMPAIGNS_NEW}>
                Start a Campaign
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
