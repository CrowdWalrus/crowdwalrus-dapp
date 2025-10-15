/**
 * Explore Tips Section
 *
 * Displays crowdfunding tips and helpful articles for users
 */

import { Pencil, Lightbulb, HandHeart } from "lucide-react";
import { TipCard } from "./TipCard";

const TIPS = [
  {
    icon: Pencil,
    title: "How to start a project?",
    href: "/tips/start-project",
  },
  {
    icon: Lightbulb,
    title: "Crowdfunding Tips",
    href: "/tips/crowdfunding",
  },
  {
    icon: HandHeart,
    title: "How to make a donation?",
    href: "/tips/make-donation",
  },
];

export function ExploreTipsSection() {
  return (
    <div className="w-full">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-10 py-[100px]">
          {/* Header */}
          <div className="flex flex-col gap-4 items-center text-center">
            <h2 className="font-semibold text-5xl text-black-500 leading-[1.2] tracking-[0.48px]">
              Crowdfunding tips
            </h2>
            <p className="text-xl text-black-400 leading-[1.6]">
              Some curated articles to help you understand how to launch project
              and participate
            </p>
          </div>

          {/* Tip Cards */}
          <div className="flex gap-10 items-center">
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
    </div>
  );
}
