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

export function ExplorePage() {
  return (
    <div>
      {/* Hero Section with Background */}
      <div className="relative">
        {/* Breadcrumb - Positioned absolutely over hero */}
        <div className="absolute top-8 left-[120px] z-20">
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

        {/* Hero Section */}
        <ExploreHeroSection />
      </div>

      {/* Rest of the page content will go here */}
    </div>
  );
}
