import { useState } from "react";

interface ProfileBadge {
  id: string;
  level: number;
  src: string | null;
  alt: string;
}

interface ProfileBadgeShowcaseProps {
  badges: ProfileBadge[];
  title?: string;
}

export function ProfileBadgeShowcase({
  badges,
  title = "User level",
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
  const [hasError, setHasError] = useState(false);

  if (!badge.src || hasError) {
    return (
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black-50 text-xs text-black-300">
        Level {badge.level}
      </div>
    );
  }

  return (
    <img
      src={badge.src}
      alt={badge.alt}
      className="h-20 w-20 rounded-full object-cover"
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
}
