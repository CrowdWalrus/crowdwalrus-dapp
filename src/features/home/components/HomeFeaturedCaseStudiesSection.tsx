import { HomeCaseStudyCard } from "./case-studies/HomeCaseStudyCard";

const CASE_STUDIES = [
  {
    imageSrc: "/assets/images/home/case-studies/case-study-1.png",
    title: "Boosting Donation Campaigns with On-chain Transparency",
    description:
      "See how creators used verifiable contributions and progress tracking to earn supporter trust and raise faster.",
  },
  {
    imageSrc: "/assets/images/home/case-studies/case-study-2.png",
    title: "Community-led Relief with Real-time Accountability",
    description:
      "A community campaign that kept donors informed with updates and milestones—while keeping funds traceable.",
  },
  {
    imageSrc: "/assets/images/home/case-studies/case-study-3.png",
    title: "From One-off Fundraiser to Sustainable Movement",
    description:
      "How a project grew from a single fundraiser into an ongoing hub with recurring support and updates.",
  },
] as const;

export function HomeFeaturedCaseStudiesSection() {
  return (
    <section className="bg-white-50">
      <div className="container px-4 lg:px-0">
        <div className="flex flex-col items-center gap-14 py-[100px]">
          <div className="mx-auto flex max-w-[1000px] flex-col gap-4 text-center">
            <h2 className="text-4xl font-semibold leading-[1.2] tracking-[0.48px] text-black-500 sm:text-5xl">
              Featured Case Studies
            </h2>
            <p className="text-lg leading-[1.6] text-black-400 sm:text-xl">
              Real results from inspiring campaigns on CrowdWalrus—how
              supporters and creators built meaningful impact, story by story.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
            {CASE_STUDIES.map((item) => (
              <HomeCaseStudyCard
                key={item.title}
                imageSrc={item.imageSrc}
                title={item.title}
                description={item.description}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
