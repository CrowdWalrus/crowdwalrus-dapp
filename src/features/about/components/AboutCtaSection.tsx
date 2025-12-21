import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { ROUTES } from "@/shared/config/routes";

export function AboutCtaSection() {
  return (
    <section className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600">
      <div className="container px-4">
        <div className="flex flex-col items-center gap-8 py-20 text-center sm:py-28 lg:py-32">
          <h2 className="max-w-[800px] text-3xl font-bold leading-tight text-white-50 sm:text-4xl lg:text-5xl">
            Ready to Get Started?
          </h2>
          <p className="max-w-[600px] text-lg text-white-50/90">
            Whether you want to launch a campaign, support a cause, or fund the
            next Web3 project — CrowdWalrus gives you the tools to do it openly,
            transparently, and without intermediaries.
          </p>

          <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:gap-6">
            <Button
              asChild
              className="h-[56px] justify-center rounded-[10px] bg-white-50 px-8 py-4 text-base font-semibold text-blue-500 shadow-none hover:bg-white-100"
            >
              <Link to={ROUTES.CAMPAIGNS_NEW}>Start a Campaign</Link>
            </Button>
            <Button
              asChild
              className="h-[56px] justify-center gap-3 rounded-[10px] border-2 border-white-50 bg-transparent px-8 py-4 text-base font-semibold text-white-50 shadow-none hover:bg-white-50/10 [&_svg]:size-5"
            >
              <Link to={ROUTES.EXPLORE}>
                Explore Projects
                <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              className="h-[56px] justify-center rounded-[10px] border-2 border-white-50/50 bg-transparent px-8 py-4 text-base font-semibold text-white-50 shadow-none hover:border-white-50 hover:bg-white-50/10"
            >
              <Link to="#">Apply for Listing</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
