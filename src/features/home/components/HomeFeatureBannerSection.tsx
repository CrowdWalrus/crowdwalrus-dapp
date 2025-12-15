import { BanknoteArrowUp, HandHeart, HeartHandshake } from "lucide-react";

function FeatureItem({
  icon: Icon,
  label,
}: {
  icon: typeof HeartHandshake;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-[30px] text-sky-700" strokeWidth={2} />
      <p className="text-xl font-medium leading-[1.6] text-black-500">
        {label}
      </p>
    </div>
  );
}

export function HomeFeatureBannerSection() {
  return (
    <section className="bg-sky-50">
      <div className="container px-4 lg:px-0">
        <div className="flex flex-col items-center justify-center gap-6 py-10 lg:flex-row lg:gap-6 lg:py-16">
          <FeatureItem
            icon={HeartHandshake}
            label="Start free, no gatekeepers"
          />

          <div className="hidden w-[240px] border-t border-dashed border-black-200 lg:block" />

          <FeatureItem icon={HandHeart} label="Own your campaign & SuiNS subname" />

          <div className="hidden w-[240px] border-t border-dashed border-black-200 lg:block" />

          <FeatureItem
            icon={BanknoteArrowUp}
            label="Contributions secured on-chain"
          />
        </div>
      </div>
    </section>
  );
}

