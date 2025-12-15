import type { LucideIcon } from "lucide-react";

interface HomeHowItWorksStepProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function HomeHowItWorksStep({
  icon: Icon,
  title,
  description,
}: HomeHowItWorksStepProps) {
  return (
    <div className="flex w-full max-w-[515px] gap-4">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500">
        <Icon className="size-6" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-2xl font-semibold leading-[1.5] text-black-500">
          {title}
        </p>
        <p className="text-base font-normal leading-[1.5] text-black-400">
          {description}
        </p>
      </div>
    </div>
  );
}

