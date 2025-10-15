/**
 * Category Card Component
 *
 * Displays a category icon with its label
 */

interface CategoryCardProps {
  icon: string;
  label: string;
}

export function CategoryCard({ icon, label }: CategoryCardProps) {
  return (
    <div className="bg-white border border-black-50 rounded-xl flex flex-col gap-3 items-center p-3 w-40 shrink-0">
      <div className="size-12 relative shrink-0">
        <img
          src={icon}
          alt={label}
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        />
      </div>
      <div className="flex flex-col justify-center shrink-0">
        <p className="font-medium text-xs text-black-500 text-center leading-[1.6] whitespace-pre-wrap">
          {label}
        </p>
      </div>
    </div>
  );
}
