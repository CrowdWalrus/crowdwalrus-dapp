interface HomeBenefitCardProps {
  imageSrc: string;
  title: string;
  description: string;
}

export function HomeBenefitCard({
  imageSrc,
  title,
  description,
}: HomeBenefitCardProps) {
  return (
    <div className="flex flex-col gap-10 rounded-2xl border border-black-100 bg-white-500 p-8">
      <div className="size-[100px]">
        <img src={imageSrc} alt="" className="h-full w-full object-cover" />
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-2xl font-semibold leading-[1.6] text-black-500">
          {title}
        </p>
        <p className="text-base font-normal leading-[1.6] text-black-400">
          {description}
        </p>
      </div>
    </div>
  );
}

