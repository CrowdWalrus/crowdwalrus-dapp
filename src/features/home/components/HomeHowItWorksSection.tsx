import { Link } from "react-router-dom";
import {
  ArrowRight,
  FileText,
  HandCoins,
  PencilLine,
  Smile,
} from "lucide-react";

import { HomeHowItWorksStep } from "./how-it-works/HomeHowItWorksStep";
import { HomeHowItWorksBackground } from "./how-it-works/HomeHowItWorksBackground";
import { HomeHowItWorksIllustration } from "./how-it-works/HomeHowItWorksIllustration";
import { Button } from "@/shared/components/ui/button";
import { ROUTES } from "@/shared/config/routes";

const STEPS = [
  {
    icon: PencilLine,
    title: "Step 1: Create Your Campaign",
    description:
      "Set a funding goal and deadline. Register your unique subname and launch your decentralized page.",
  },
  {
    icon: HandCoins,
    title: "Step 2: Collect Contributions",
    description:
      "Support flows directly to your wallet. All transactions are recorded on-chain for full transparency",
  },
  {
    icon: Smile,
    title: "Step 3: Rally Your Community",
    description:
      "Share your campaign link, post updates, and engage supporters as your campaign grows.",
  },
] as const;

export function HomeHowItWorksSection() {
  return (
    <section className="relative overflow-hidden bg-white-50">
      <HomeHowItWorksBackground />

      <div className="relative">
        <div className="container px-4 lg:px-0">
          <div className="flex flex-col pb-[80px] pt-[100px]">
            <div className="mx-auto flex max-w-[720px] flex-col items-center gap-4 text-center">
              <h2 className="text-4xl font-semibold leading-[1.5] text-black-500 sm:text-5xl">
                How CrowdWalrus Works?
              </h2>
              <p className="text-lg font-normal leading-[1.5] text-black-400 sm:text-xl">
                CrowdWalrus is more than just a platform; it&apos;s a launchpad
                for your ideas.
              </p>
            </div>

            <div className="mx-auto pt-[80px] grid w-full max-w-[1330px] grid-cols-1 items-center gap-16 lg:grid-cols-[535px_587px] lg:gap-[208px]">
              <div className="flex flex-col gap-[60px] lg:pt-6">
                {STEPS.map((step) => (
                  <HomeHowItWorksStep
                    key={step.title}
                    icon={step.icon}
                    title={step.title}
                    description={step.description}
                  />
                ))}
              </div>

              <div className="flex justify-center lg:justify-end">
                <HomeHowItWorksIllustration />
              </div>
            </div>

            <div className="pt-[80px] flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
              <Button
                asChild
                className="h-[52px] justify-center gap-3 rounded-[8px] bg-blue-50 pl-[23px] pr-[24px] py-[14px] text-base font-medium text-blue-500 shadow-none hover:bg-blue-100 [&_svg]:size-5"
              >
                <Link to={ROUTES.EXPLORE}>
                  <FileText />
                  Read Docs
                </Link>
              </Button>

              <Button
                asChild
                className="h-[52px] justify-center gap-3 rounded-[8px] bg-blue-500 pl-[24px] pr-[23px] py-[14px] text-base font-medium text-white-50 shadow-none hover:bg-blue-600 [&_svg]:size-5"
              >
                <Link to={ROUTES.CAMPAIGNS_NEW}>
                  Launch Campaign
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
