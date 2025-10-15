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

export function ExplorePage() {
  return (
    <div className="py-8">
      <div className="container px-4">
        {/* Breadcrumb */}
        <div className="pb-10">
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

        {/* Main content container */}
        <div className="container px-4 mx-auto max-w-4xl">
          <h1 className="text-5xl font-bold mb-10">Explore</h1>
        </div>
      </div>
    </div>
  );
}
