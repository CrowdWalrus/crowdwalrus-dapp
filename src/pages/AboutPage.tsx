import { AboutHeroSection } from "@/features/about/components/AboutHeroSection";
import { AboutProblemSection } from "@/features/about/components/AboutProblemSection";
import { AboutFeaturesSection } from "@/features/about/components/AboutFeaturesSection";
import { AboutAudienceSection } from "@/features/about/components/AboutAudienceSection";
import { AboutTrustSection } from "@/features/about/components/AboutTrustSection";
import { AboutFeesSection } from "@/features/about/components/AboutFeesSection";
import { AboutVisionSection } from "@/features/about/components/AboutVisionSection";
import { AboutTeamSection } from "@/features/about/components/AboutTeamSection";
import { AboutCtaSection } from "@/features/about/components/AboutCtaSection";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";

export function AboutPage() {
  useDocumentTitle("About Us");

  return (
    <div>
      <AboutHeroSection />
      <AboutProblemSection />
      <AboutFeaturesSection />
      <AboutAudienceSection />
      <AboutTrustSection />
      <AboutFeesSection />
      <AboutVisionSection />
      <AboutTeamSection />
      <AboutCtaSection />
    </div>
  );
}
