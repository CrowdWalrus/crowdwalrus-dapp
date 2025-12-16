import { Coins, HandHeart, Rocket } from "lucide-react";

export function AboutFeesSection() {
  return (
    <section className="bg-white-50">
      <div className="container px-4">
        <div className="flex flex-col items-center gap-12 py-20 text-center sm:py-28 lg:py-32">
          <div className="flex flex-col gap-6">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
              <Coins className="h-4 w-4" />
              Fees & Sustainability
            </div>
            <h2 className="max-w-[700px] text-3xl font-bold leading-tight text-black-500 sm:text-4xl lg:text-5xl">
              Fair, Transparent Pricing
            </h2>
          </div>

          <div className="grid w-full max-w-[1000px] gap-6 sm:grid-cols-2 lg:gap-8">
            <div className="flex flex-col gap-4 rounded-3xl border border-sgreen-400 bg-sgreen-50 p-8 text-left">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sgreen-100">
                <HandHeart className="h-6 w-6 text-sgreen-600" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold text-black-500">
                  Public Goods & Non-Profits
                </h3>
                <p className="text-base text-black-300">
                  Fundraise without platform fees
                </p>
              </div>
              <div className="mt-auto text-3xl font-bold text-sgreen-600">
                0% Fee
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-3xl border border-purple-300 bg-purple-50 p-8 text-left">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                <Rocket className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold text-black-500">
                  Commercial Campaigns
                </h3>
                <p className="text-base text-black-300">
                  Contribute to sustaining the platform
                </p>
              </div>
              <div className="mt-auto text-3xl font-bold text-purple-600">
                Self-Declared
              </div>
            </div>
          </div>

          <p className="max-w-[600px] text-base text-black-300">
            CrowdWalrus applies a platform fee only to commercial campaigns,
            based on self-declaration by the campaign owner. No hidden
            deductions — all rules are explicit and transparent.
          </p>
        </div>
      </div>
    </section>
  );
}
