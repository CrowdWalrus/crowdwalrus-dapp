/**
 * Explore Page
 *
 * Browse and discover campaigns
 */

import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/shared/components/ui/breadcrumb";
import { ROUTES } from "@/shared/config/routes";
import { ExploreHeroSection } from "@/features/explore/components/ExploreHeroSection";
import { ExploreCampaignsSection } from "@/features/explore/components/ExploreCampaignsSection";
import { ExploreManifestoSection } from "@/features/explore/components/ExploreManifestoSection";

export function ExplorePage() {
  return (
    <div>
      {/* Hero Section with Background */}
      <div className="relative">
        {/* Breadcrumb - Inside Container, Positioned Absolutely */}
        <div className="absolute top-8 left-0 right-0 z-20">
          <div className="container mx-auto px-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={ROUTES.HOME}>Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Explore</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        {/* Hero Section */}
        <ExploreHeroSection />
      </div>

      {/* Explore Campaigns Section */}
      <ExploreCampaignsSection />

      {/* Manifesto Section */}
      <ExploreManifestoSection />
    </div>
  );
}
