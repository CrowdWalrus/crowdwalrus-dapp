import { HandHeart, Lightbulb, Pencil } from "lucide-react";

import { TipCard } from "@/features/explore/components/TipCard";
import { DOCS_LINKS } from "@/shared/config/docsLinks";

const TIPS = [
  {
    icon: Pencil,
    title: "How to start a project?",
    href: DOCS_LINKS.campaignOwners.launchCampaign,
  },
  {
    icon: Lightbulb,
    title: "Crowdfunding Tips",
    href: DOCS_LINKS.campaignOwners.campaignWritingToolkit,
  },
  {
    icon: HandHeart,
    title: "How to make a donation?",
    href: DOCS_LINKS.donors.howToContribute,
  },
] as const;

export function HomeTipsSection() {
  return (
    <section className="bg-white-50">
      <div className="container px-4">
        <div className="flex flex-col gap-10 py-[100px]">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-4xl font-semibold leading-[1.2] tracking-[0.48px] text-black-500 sm:text-5xl">
              Crowdfunding tips
            </h2>
            <p className="max-w-2xl text-lg leading-[1.6] text-black-400 sm:text-xl">
              Some curated articles to help you understand how to launch project
              and participate
            </p>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
            {TIPS.map((tip) => (
              <TipCard
                key={tip.title}
                icon={tip.icon}
                title={tip.title}
                href={tip.href}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
