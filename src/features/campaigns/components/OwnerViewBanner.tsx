interface OwnerViewBannerProps {
  isOwnerView: boolean;
  onToggleView: () => void;
}

export function OwnerViewBanner({
  isOwnerView,
  onToggleView,
}: OwnerViewBannerProps) {
  return (
    <div className="bg-purple-100 flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6 items-center justify-center px-4 sm:px-6 py-3">
      <p className="font-medium text-xs sm:text-sm text-black-500 text-center sm:text-left">
        {isOwnerView
          ? "You see this view because you're a Campaign owner"
          : "You're viewing the public version of your campaign"}
      </p>
      <button
        onClick={onToggleView}
        className="bg-white-50 border border-black-50 flex gap-1.5 items-center justify-center min-h-8 px-3 py-1.5 rounded-lg shrink-0 w-full sm:w-auto"
        type="button"
      >
        <span className="font-medium text-xs sm:text-sm text-black-500 text-center">
          {isOwnerView ? "Switch to Public View" : "Switch to Owner View"}
        </span>
      </button>
    </div>
  );
}
