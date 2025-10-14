interface OwnerViewBannerProps {
  isOwnerView: boolean;
  onToggleView: () => void;
}

export function OwnerViewBanner({
  isOwnerView,
  onToggleView,
}: OwnerViewBannerProps) {
  return (
    <div className="bg-purple-100 flex gap-6 items-center justify-center px-4 py-3">
      <p className="font-medium text-sm text-black-500 whitespace-nowrap">
        {isOwnerView
          ? "You see this view because you're a Campaign owner"
          : "You're viewing the public version of your campaign"}
      </p>
      <button
        onClick={onToggleView}
        className="bg-white-50 border border-black-50 flex gap-1.5 items-center justify-center min-h-8 px-3 py-1.5 rounded-lg shrink-0"
        type="button"
      >
        <span className="font-medium text-sm text-black-500 text-center whitespace-nowrap">
          {isOwnerView ? "Switch to Public View" : "Switch to Owner View"}
        </span>
      </button>
    </div>
  );
}
