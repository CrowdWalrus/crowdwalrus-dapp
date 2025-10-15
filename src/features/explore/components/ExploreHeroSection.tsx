/**
 * Explore Hero Section
 *
 * Hero section for the Explore page with category navigation
 */

import { CategoryCard } from "./CategoryCard";

const CATEGORIES = [
  {
    icon: "/assets/images/explore-icons/art-culture.png",
    label: "Art & Culture",
  },
  {
    icon: "/assets/images/explore-icons/community.png",
    label: "Community",
  },
  {
    icon: "/assets/images/explore-icons/education.png",
    label: "Education",
  },
  {
    icon: "/assets/images/explore-icons/energy.png",
    label: "Environment & Energy",
  },
  {
    icon: "/assets/images/explore-icons/health.png",
    label: "Health & Wellness",
  },
  {
    icon: "/assets/images/explore-icons/ngo.png",
    label: "NGO",
  },
  {
    icon: "/assets/images/explore-icons/technology.png",
    label: "Technology",
  },
];

export function ExploreHeroSection() {
  return (
    <div className="relative w-full h-[644px]">
      {/* Background Layer */}
      <div className="absolute inset-0 bg-white overflow-hidden">
        {/* Background Image with Opacity */}
        <div className="absolute inset-0 opacity-15">
          <img
            src="/assets/images/background-images/explore-bg-1.png"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white from-[10%] to-transparent to-[35%]" />
      </div>

      {/* Content Layer */}
      <div className="absolute left-1/2 top-[240px] -translate-x-1/2 flex flex-col gap-12 items-center">
        {/* Title and Description */}
        <div className="flex flex-col gap-10 items-center justify-center w-full shrink-0">
          <div className="flex flex-col gap-6 items-center text-center w-full shrink-0">
            <h1 className="font-semibold text-[72px] text-black-500 leading-[1.2] min-w-full w-min shrink-0">
              Discover Campaigns
            </h1>
            <p className="font-medium text-xl text-black-400 leading-[1.5] w-[960px] shrink-0">
              Explore various campaigns and nonprofits, and contribute to the
              ones that resonate with your values and make a meaningful impact.
            </p>
          </div>
        </div>

        {/* Category Cards */}
        <div className="flex gap-4 items-start justify-center shrink-0">
          {CATEGORIES.map((category) => (
            <CategoryCard
              key={category.label}
              icon={category.icon}
              label={category.label}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
