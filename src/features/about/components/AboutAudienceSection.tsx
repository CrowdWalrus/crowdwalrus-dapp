import { Code2, HandHeart, Rocket, Users } from "lucide-react";

const AUDIENCES = [
  {
    icon: Rocket,
    title: "Creators & Fundraisers",
    description:
      "Artists, builders, nonprofits, activists, startups, and community organizers who want full ownership of their campaigns and funds.",
    color: "blue",
  },
  {
    icon: HandHeart,
    title: "Donors & Supporters",
    description:
      "People who want to support causes directly, transparently, and without intermediaries.",
    color: "purple",
  },
  {
    icon: Code2,
    title: "Public Goods & Web3 Projects",
    description:
      "Open-source software, protocols, ecosystems, and community initiatives that struggle to fundraise on traditional platforms.",
    color: "sky",
  },
];

const COLOR_CLASSES = {
  blue: {
    bg: "bg-blue-50",
    icon: "bg-blue-100 text-blue-500",
    border: "hover:border-blue-200",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "bg-purple-100 text-purple-500",
    border: "hover:border-purple-200",
  },
  sky: {
    bg: "bg-sky-50",
    icon: "bg-sky-100 text-sky-500",
    border: "hover:border-sky-200",
  },
};

export function AboutAudienceSection() {
  return (
    <section className="bg-white-50">
      <div className="container px-4">
        <div className="flex flex-col gap-16 py-20 sm:py-28 lg:py-32">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-4 py-2 text-sm font-medium text-purple-500">
              <Users className="h-4 w-4" />
              Who It's For
            </div>
            <h2 className="max-w-[700px] text-3xl font-bold leading-tight text-black-500 sm:text-4xl lg:text-5xl">
              Built for Those Who Build
            </h2>
          </div>

          <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
            {AUDIENCES.map((audience, idx) => {
              const colors = COLOR_CLASSES[audience.color as keyof typeof COLOR_CLASSES];
              return (
                <div
                  key={idx}
                  className={`group flex flex-col gap-6 rounded-3xl border border-white-600 ${colors.bg} p-8 transition-all ${colors.border}`}
                >
                  <div
                    className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${colors.icon}`}
                  >
                    <audience.icon className="h-7 w-7" />
                  </div>
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xl font-bold text-black-500 sm:text-2xl">
                      {audience.title}
                    </h3>
                    <p className="text-base leading-relaxed text-black-300">
                      {audience.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
