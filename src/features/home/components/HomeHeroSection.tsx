import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { ROUTES } from "@/shared/config/routes";
import { HomeHeroBackground } from "./hero/HomeHeroBackground";

export function HomeHeroSection() {
  return (
    <section className="relative overflow-hidden bg-white-50">
      <HomeHeroBackground />

      <div className="relative">
        <div className="container px-4">
          <div className="flex flex-col gap-10 pb-16 pt-12 sm:pb-20 sm:pt-16 lg:pb-[273px] lg:pt-[185px]">
            <div className="flex max-w-[780px] flex-col gap-6">
              <h1 className="font-semibold leading-[1.2] text-black-500">
                <span className="block text-[44px] sm:text-[56px] lg:text-[72px]">
                  Fundraise
                </span>
                <span className="block text-[44px] text-blue-500 sm:text-[56px] lg:text-[72px]">
                  Without Barriers
                </span>
              </h1>

              <p className="text-lg font-medium leading-[1.5] text-black-400 sm:text-xl">
                CrowdWalrus is decentralized crowdfunding for communities,
                creators, and startups. Launch time-bound campaigns with clear
                goals and funding windows. Receive contributions directly into
                your wallet—transparent, censorship-resistant, and
                community-driven.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <Button
                asChild
                className="h-[52px] justify-center rounded-[8px] bg-blue-500 px-[24px] py-[14px] text-base font-medium text-white-50 shadow-none hover:bg-blue-600"
              >
                <Link to={ROUTES.CAMPAIGNS_NEW}>Start a Campaign</Link>
              </Button>

              <Button
                asChild
                className="h-[52px] justify-center gap-3 rounded-[8px] border border-white-50 bg-white-50 pl-[24px] pr-[23px] py-[14px] text-base font-medium text-black-500 shadow-none hover:bg-white-100 [&_svg]:size-5"
              >
                <Link to={ROUTES.EXPLORE}>
                  Explore Campaigns
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
