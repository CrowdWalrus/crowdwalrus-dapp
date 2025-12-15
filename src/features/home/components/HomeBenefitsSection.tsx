import { HomeBenefitCard } from "./benefits/HomeBenefitCard";

const BENEFITS = [
  {
    imageSrc: "/assets/images/home/benefits/benefit-1.png",
    title: "From Idea to Live in Minutes",
    description:
      "Create a campaign, claim your subname (e.g. mycause.crowdwalrus.sui), and start accepting contributions instantly. No backend, no jargon. Just connect your wallet and go.",
  },
  {
    imageSrc: "/assets/images/home/benefits/benefit-2.png",
    title: "You Don’t Rent a Page—You Own the Platform",
    description:
      "campaign is on-chain, hosted on Walrus, and backed by a custom .sui subname. No lock-ins. No arbitrary takedowns. Ever.",
  },
  {
    imageSrc: "/assets/images/home/benefits/benefit-3.png",
    title: "Grow a Movement (or Fund a One-Off)",
    description:
      "Run multiple campaigns under one hub. Post updates, share milestones, and let supporters follow your journey and keep contributing over time.",
  },
] as const;

export function HomeBenefitsSection() {
  return (
    <section className="bg-white-50">
      <div className="container px-4 lg:px-0">
        <div className="flex flex-col gap-16 py-[100px] lg:gap-20">
          <div className="mx-auto flex max-w-[1000px] flex-col items-center gap-6 text-center">
            <h2 className="max-w-[726px] text-4xl font-semibold leading-[1.2] tracking-[0.48px] text-black-500 sm:text-5xl">
              Fund on Your Terms,
              <br />
              Built for Web3—Simple as Web2
            </h2>
            <p className="text-lg font-normal leading-[1.6] text-black-400 sm:text-xl">
              CrowdWalrus is more than just a platform; it&apos;s a launchpad for
              your ideas. We&apos;ve removed blockchain complexity so you can
              focus on your mission. Create a permanent, tamper-resistant home
              for your campaign, rally your community, and raise funds with
              clarity and control.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-10">
            {BENEFITS.map((benefit) => (
              <HomeBenefitCard
                key={benefit.title}
                imageSrc={benefit.imageSrc}
                title={benefit.title}
                description={benefit.description}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
