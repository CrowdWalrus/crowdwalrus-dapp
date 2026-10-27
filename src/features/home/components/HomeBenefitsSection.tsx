import { HomeBenefitCard } from "./benefits/HomeBenefitCard";

const BENEFITS = [
  {
    imageSrc: "/assets/images/home/benefits/benefit-1.png",
    title: "From Idea to Live in Minutes",
    description:
      "Creators could set up a campaign, claim a subname (e.g. mycause.crowdwalrus.sui), and start accepting contributions within minutes, with no backend and no jargon.",
  },
  {
    imageSrc: "/assets/images/home/benefits/benefit-2.png",
    title: "You Don’t Rent a Page—You Own the Platform",
    description:
      "Every campaign lived on-chain, hosted on Walrus and backed by a custom .sui subname. No lock-ins. No arbitrary takedowns.",
  },
  {
    imageSrc: "/assets/images/home/benefits/benefit-3.png",
    title: "Grow a Movement (or Fund a One-Off)",
    description:
      "Creators could run multiple campaigns under one hub, post updates, and share milestones so supporters could follow their journey over time.",
  },
] as const;

export function HomeBenefitsSection() {
  return (
    <section className="bg-white-50">
      <div className="container px-4">
        <div className="flex flex-col items-center gap-16 py-[100px] lg:gap-20">
          <div className="mx-auto flex max-w-[1000px] flex-col items-center gap-6 text-center">
            <h2 className="max-w-[726px] text-4xl font-semibold leading-[1.2] tracking-[0.48px] text-black-500 sm:text-5xl">
              Fund on Your Terms,
              <br />
              Built for Web3—Simple as Web2
            </h2>
            <p className="text-lg font-normal leading-[1.6] text-black-400 sm:text-xl">
              CrowdWalrus set out to be more than just a platform: a launchpad
              for ideas. It removed blockchain complexity so creators could
              focus on their mission, giving each campaign a permanent,
              tamper-resistant home to rally a community and raise funds with
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
