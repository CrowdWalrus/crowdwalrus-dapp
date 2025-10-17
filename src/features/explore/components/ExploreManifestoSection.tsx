/**
 * Explore Manifesto Section
 *
 * Call-to-action section encouraging users to start fundraising campaigns
 */

import { Button } from "@/shared/components/ui/button";

export function ExploreManifestoSection() {
  return (
    <div className="relative w-full bg-blue-600 overflow-hidden">
      {/* Background Pattern with Opacity */}
      <div className="absolute inset-0 opacity-[0.16] pointer-events-none">
        <img
          src="/assets/images/background-images/manifesto-bg-pattern.svg"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="relative">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-6 items-center py-24 lg:py-32">
            {/* Subtitle */}
            <p className="text-xl text-white text-center">
              Join us in making a difference in the world! Together, we can
              create lasting change.
            </p>

            {/* Main Heading */}
            <h2 className="text-5xl font-semibold text-white text-center max-w-[1000px]">
              Looking for assistance to fund your humanitarian projects?
              We&apos;re here to help!
            </h2>

            {/* CTA Button */}
            <Button className="bg-white-50 text-blue-500 hover:bg-white-100 rounded-lg px-6 py-2.5 h-auto font-medium text-sm">
              Start Your Fundraising Journey
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
