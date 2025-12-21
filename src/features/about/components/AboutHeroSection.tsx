import { Eye, Shield, Wallet } from "lucide-react";

export function AboutHeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600">
      {/* Background Pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-white-50" />
        <div className="absolute -bottom-48 -left-32 h-[400px] w-[400px] rounded-full bg-purple-500" />
      </div>

      <div className="relative">
        <div className="container px-4">
          <div className="flex flex-col items-center gap-8 py-20 text-center text-white-50 sm:py-28 lg:py-36">
            <div className="flex max-w-[900px] flex-col gap-6">
              <h1 className="text-3xl font-bold leading-[1.2] sm:text-5xl lg:text-6xl">
                Decentralized Crowdfunding,{" "}
                <span className="text-sky-300">Built for Everyone</span>
              </h1>
              <p className="mx-auto max-w-[750px] text-lg font-medium leading-relaxed text-white-50/90 sm:text-xl">
                CrowdWalrus is a fully on-chain, decentralized crowdfunding
                platform built for creators, communities, and public goods.
                From payments to profiles, updates to reports — everything lives
                on-chain.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:gap-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white-50/15 px-5 py-2.5 text-sm font-medium backdrop-blur-sm">
                <Shield className="h-4 w-4" />
                No gatekeepers
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white-50/15 px-5 py-2.5 text-sm font-medium backdrop-blur-sm">
                <Eye className="h-4 w-4" />
                No hidden cuts
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white-50/15 px-5 py-2.5 text-sm font-medium backdrop-blur-sm">
                <Wallet className="h-4 w-4" />
                Just you and your supporters
              </div>
            </div>

            <p className="pt-6 text-base font-medium text-white-50/80">
              Built on <span className="text-sky-300">Sui blockchain</span> and
              the <span className="text-sky-300">Walrus ecosystem</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
