import { useWalrusImage } from "@/features/campaigns/hooks/useWalrusImage";

interface ProfileBadge {
  id: string;
  src: string;
  alt: string;
}

interface ProfileBadgeShowcaseProps {
  badges: ProfileBadge[];
  title?: string;
}

export function ProfileBadgeShowcase({
  badges,
  title = "Your user level",
}: ProfileBadgeShowcaseProps) {
  if (!badges.length) {
    return null;
  }

  return (
    <section className="flex flex-col items-center gap-6 text-center">
      <h2 className="text-xl font-semibold text-black-500">{title}</h2>
      <div className="flex flex-wrap items-center justify-center gap-6">
        {badges.map((badge) => (
          <BadgeImage key={badge.id} badge={badge} />
        ))}
      </div>
    </section>
  );
}

function BadgeImage({ badge }: { badge: ProfileBadge }) {
  const {
    data: imageObjectUrl,
    isPending,
    isError,
  } = useWalrusImage(badge.src);

  if (isPending) {
    return (
      <div
        className="h-20 w-20 animate-pulse rounded-full bg-black-50"
        aria-hidden
      />
    );
  }

  if (isError || !imageObjectUrl) {
    return (
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black-50 text-xs text-black-300">
        Badge
      </div>
    );
  }

  return (
    <img
      src={imageObjectUrl}
      alt={badge.alt}
      className="h-20 w-20 rounded-full object-cover"
      loading="lazy"
    />
  );
}
