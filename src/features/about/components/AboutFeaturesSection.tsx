import { BadgeCheck, Layers, Sparkles, Users } from "lucide-react";

const FEATURES = [
  {
    icon: Layers,
    title: "Everything is on-chain",
    description:
      "Payments, campaigns, project data, user profiles, updates, and public reports are all recorded on-chain. Transparency isn't a feature — it's the foundation.",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    icon: BadgeCheck,
    title: "Human-readable on-chain identities",
    description:
      "Campaign names and user profile nicknames are registered as SuiNS subnames under crowdwalrus.sui (e.g. yourname.crowdwalrus.sui).",
    gradient: "from-purple-500 to-purple-600",
  },
  {
    icon: Sparkles,
    title: "NFT rewards for contributors",
    description:
      "CrowdWalrus includes NFT reward tiers that recognize the most active and impactful contributors. These NFTs act as visible, on-chain reputation badges.",
    gradient: "from-sky-500 to-sky-600",
  },
  {
    icon: Users,
    title: "Built for real people",
    description:
      "Despite using advanced blockchain infrastructure, CrowdWalrus is designed to feel like a normal website — no technical knowledge required.",
    gradient: "from-green-500 to-green-600",
  },
];

export function AboutFeaturesSection() {
  return (
    <section className="bg-black-500">
      <div className="container px-4">
        <div className="flex flex-col gap-16 py-20 sm:py-28 lg:py-32">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-300">
              <Sparkles className="h-4 w-4" />
              What Makes Us Different
            </div>
            <h2 className="max-w-[700px] text-3xl font-bold leading-tight text-white-50 sm:text-4xl lg:text-5xl">
              A New Standard for Crowdfunding
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
            {FEATURES.map((feature, idx) => (
              <div
                key={idx}
                className="group relative overflow-hidden rounded-3xl border border-black-400 bg-black-400/50 p-8 transition-all hover:border-purple-500/50 hover:bg-black-400/80"
              >
                <div
                  className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} text-white-50`}
                >
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-4 text-xl font-bold text-white-50 sm:text-2xl">
                  {feature.title}
                </h3>
                <p className="text-base leading-relaxed text-white-700">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
