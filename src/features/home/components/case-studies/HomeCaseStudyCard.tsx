interface HomeCaseStudyCardProps {
  imageSrc: string;
  title: string;
  description: string;
}

export function HomeCaseStudyCard({
  imageSrc,
  title,
  description,
}: HomeCaseStudyCardProps) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-black-50 bg-white-50">
      <div className="h-[220px] w-full overflow-hidden bg-white-600">
        <img
          src={imageSrc}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-col gap-3 p-6">
        <p className="text-lg font-semibold leading-[1.5] text-black-500">
          {title}
        </p>
        <p className="text-sm leading-[1.6] text-black-400">{description}</p>
      </div>
    </div>
  );
}

