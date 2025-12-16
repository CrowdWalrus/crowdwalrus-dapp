import { Coins, Globe, Lock, XCircle } from "lucide-react";

const PROBLEMS = [
  { icon: Coins, text: "Take 5–10% platform fees" },
  { icon: Lock, text: "Control who is allowed to fundraise" },
  { icon: XCircle, text: "Can remove campaigns or freeze funds without warning" },
  { icon: Globe, text: "Exclude people based on geography, banking access, or internal policies" },
];

export function AboutProblemSection() {
  return (
    <section className="bg-white-50">
      <div className="container px-4">
        <div className="flex flex-col gap-12 py-20 sm:py-28 lg:flex-row lg:items-start lg:gap-20 lg:py-32">
          {/* Left Column */}
          <div className="flex flex-1 flex-col gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-500">
              <XCircle className="h-4 w-4" />
              The Problem
            </div>
            <h2 className="text-3xl font-bold leading-tight text-black-500 sm:text-4xl lg:text-5xl">
              Why CrowdWalrus Exists
            </h2>
            <p className="max-w-[600px] text-lg leading-relaxed text-black-300">
              Traditional crowdfunding platforms are centralized by default.
              For creators, nonprofits, open-source teams, and communities,
              this often means{" "}
              <strong className="text-black-500">
                losing ownership over their own funding and data
              </strong>
              .
            </p>
          </div>

          {/* Right Column - Problems List */}
          <div className="flex flex-1 flex-col gap-4">
            {PROBLEMS.map((problem, idx) => (
              <div
                key={idx}
                className="group flex items-start gap-4 rounded-2xl border border-white-600 bg-white-100 p-5 transition-all hover:border-red-200 hover:bg-red-50/50"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-500 transition-colors group-hover:bg-red-200">
                  <problem.icon className="h-5 w-5" />
                </div>
                <p className="pt-2 text-base font-medium text-black-400">
                  {problem.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Solution Banner */}
        <div className="pb-20 sm:pb-28 lg:pb-32">
          <div className="rounded-3xl bg-gradient-to-r from-blue-500 to-purple-500 p-8 text-center sm:p-12">
            <p className="text-xl font-semibold text-white-50 sm:text-2xl">
              CrowdWalrus exists to offer an alternative:{" "}
              <span className="text-sky-200">
                open fundraising infrastructure that anyone can use and everyone
                can verify.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
