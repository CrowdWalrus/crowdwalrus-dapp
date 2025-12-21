import { Link } from "react-router-dom";
import {
  Eye,
  Shield,
  BadgeCheck,
  Globe,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";

const TRANSPARENCY_FEATURES = [
  {
    icon: Eye,
    text: "Campaigns, payments, updates, and data are publicly verifiable",
  },
  {
    icon: Globe,
    text: "Anyone can create a campaign, no gatekeepers",
  },
  {
    icon: BadgeCheck,
    text: "Verified Badge for campaigns that pass review process",
  },
  {
    icon: Shield,
    text: "Featured visibility for verified projects",
  },
];

export function ContactTransparencySection() {
  return (
    <section className="bg-gradient-to-br from-black-500 via-black-500 to-purple-900/30">
      <div className="container px-4">
        <div className="flex flex-col gap-12 py-20 sm:py-28 lg:flex-row lg:items-center lg:gap-16 lg:py-32">
          {/* Left Content */}
          <div className="flex flex-1 flex-col gap-8">
            <div className="flex flex-col gap-6">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-green-500/20 px-4 py-2 text-sm font-medium text-green-500">
                <Shield className="h-4 w-4" />
                Transparency First
              </div>
              <h2 className="text-3xl font-bold leading-tight text-white-50 sm:text-4xl lg:text-5xl">
                ⛓️ Built with an On-Chain First Mindset
              </h2>
              <p className="max-w-[500px] text-lg text-white-700">
                CrowdWalrus believes in radical transparency. Every action,
                every transaction, every update: it's all on-chain and
                verifiable by anyone.
              </p>
            </div>

            <ul className="flex flex-col gap-4">
              {TRANSPARENCY_FEATURES.map((feature, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-white-50/90"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4">
              <Button
                asChild
                className="h-12 gap-2 rounded-xl bg-green-500 px-6 font-semibold text-black-500 transition-all hover:scale-105 hover:bg-green-400 [&_svg]:size-5"
              >
                <Link to="#">
                  Learn About Verification
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Visual */}
          <div className="flex flex-1 justify-center">
            <div className="relative w-full max-w-sm">
              {/* Main Card */}
              <div className="relative z-10 rounded-3xl border border-black-400 bg-black-400/80 p-8 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-6 text-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600">
                    <BadgeCheck className="h-12 w-12 text-black-500" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-bold text-white-50">
                      Verified Badge
                    </h3>
                    <p className="max-w-[250px] text-sm text-white-700">
                      Campaigns that request review and pass verification
                      receive a Verified Badge
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-500">
                      Trusted
                    </span>
                    <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-medium text-sky-500">
                      On-Chain
                    </span>
                    <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-500">
                      Featured
                    </span>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -right-4 -top-4 h-full w-full rounded-3xl border border-green-500/20 bg-green-500/5" />
              <div className="absolute -right-8 -top-8 h-full w-full rounded-3xl border border-green-500/10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
