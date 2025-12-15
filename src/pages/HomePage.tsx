import { HomeBenefitsSection } from "@/features/home/components/HomeBenefitsSection";
import { HomeDiscoverCampaignsSection } from "@/features/home/components/HomeDiscoverCampaignsSection";
import { HomeFeaturedCaseStudiesSection } from "@/features/home/components/HomeFeaturedCaseStudiesSection";
import { HomeFeatureBannerSection } from "@/features/home/components/HomeFeatureBannerSection";
import { HomeHeroSection } from "@/features/home/components/HomeHeroSection";
import { HomeHowItWorksSection } from "@/features/home/components/HomeHowItWorksSection";
import { HomeManifestoSection } from "@/features/home/components/HomeManifestoSection";
import { HomeTipsSection } from "@/features/home/components/HomeTipsSection";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";

export function HomePage() {
  useDocumentTitle("Home");

  return (
    <div>
      <HomeHeroSection />
      <HomeFeatureBannerSection />
      <HomeBenefitsSection />
      <HomeHowItWorksSection />
      <HomeDiscoverCampaignsSection />
      <HomeFeaturedCaseStudiesSection />
      <HomeManifestoSection />
      <HomeTipsSection />
    </div>
  );
}

