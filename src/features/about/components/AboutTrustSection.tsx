import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Shield } from "lucide-react";

import { Button } from "@/shared/components/ui/button";

const FEATURES = [
  "Raise funds",
  "Publish updates",
  "Receive donations",
  "Use all platform features",
];

export function AboutTrustSection() {
  return (
    <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-white-50">
      <div className="container px-4">
        <div className="flex flex-col gap-12 py-20 sm:py-28 lg:flex-row lg:items-center lg:gap-20 lg:py-32">
          {/* Left Column */}
          <div className="flex flex-1 flex-col gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-500">
              <Shield className="h-4 w-4" />
              Trust & Verification
            </div>
            <h2 className="text-3xl font-bold leading-tight text-black-500 sm:text-4xl lg:text-5xl">
              Open by Default,
              <br />
              <span className="text-blue-500">Trust by Choice</span>
            </h2>
            <p className="max-w-[550px] text-lg leading-relaxed text-black-300">
              Anyone can create a campaign on CrowdWalrus. There are no approval
              gatekeepers to start fundraising. However, only campaigns that
              request review and receive a verification badge are featured
              prominently on the platform.
            </p>
            <Button
              asChild
              className="mt-2 h-[52px] w-fit justify-center gap-3 rounded-[8px] bg-blue-500 px-6 py-3.5 text-base font-medium text-white-50 shadow-none hover:bg-blue-600 [&_svg]:size-5"
            >
              <Link to="#">
                Learn about verification
                <ArrowRight />
              </Link>
            </Button>
          </div>

          {/* Right Column */}
          <div className="flex flex-1 flex-col gap-6">
            <div className="flex flex-col gap-5 rounded-2xl border border-white-600 bg-white-50 p-8 shadow-sm">
              <h3 className="text-lg font-bold text-black-500">
                Non-verified campaigns can still:
              </h3>
              <div className="flex flex-col gap-4">
                {FEATURES.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sgreen-100">
                      <CheckCircle2 className="h-4 w-4 text-sgreen-500" />
                    </div>
                    <span className="text-base font-medium text-black-400">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6">
              <p className="text-base leading-relaxed text-orange-800">
                <strong>Note:</strong> Verification affects{" "}
                <strong>visibility and trust signaling</strong> — not permission
                to exist.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
