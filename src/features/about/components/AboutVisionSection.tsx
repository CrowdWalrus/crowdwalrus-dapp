import { Layers, Rocket, Sparkles, Target } from "lucide-react";

const VISIONS = [
  {
    icon: Target,
    text: "Quadratic Funding (QF) supports public goods at scale",
  },
  {
    icon: Rocket,
    text: "Web3 projects and startups can fundraise openly from their communities",
  },
  {
    icon: Layers,
    text: "Crowdfunding infrastructure is neutral, open, and composable",
  },
];

export function AboutVisionSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-blue-700">
      {/* Background Pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <div className="absolute -right-48 top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-white-50" />
        <div className="absolute -left-32 top-0 h-[400px] w-[400px] rounded-full bg-purple-300" />
      </div>

      <div className="relative">
        <div className="container px-4">
          <div className="flex flex-col gap-12 py-20 sm:py-28 lg:py-32">
            <div className="flex flex-col gap-6">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white-50/15 px-4 py-2 text-sm font-medium text-white-50 backdrop-blur-sm">
                <Sparkles className="h-4 w-4" />
                Our Vision
              </div>
              <h2 className="max-w-[600px] text-3xl font-bold leading-tight text-white-50 sm:text-4xl lg:text-5xl">
                Building the Future of Community Funding
              </h2>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-lg font-medium text-white-50/80">
                We envision a future where:
              </p>
              <div className="flex flex-col gap-4">
                {VISIONS.map((vision, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 rounded-2xl border border-white-50/20 bg-white-50/10 p-5 backdrop-blur-sm"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white-50/20">
                      <vision.icon className="h-5 w-5 text-white-50" />
                    </div>
                    <p className="pt-1.5 text-base font-medium text-white-50/90">
                      {vision.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <p className="max-w-[700px] text-lg font-medium text-sky-200">
              CrowdWalrus aims to become a core funding layer for public goods,
              Web3 ecosystems, and open innovation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
