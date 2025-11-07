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
          <img
            key={badge.id}
            src={badge.src}
            alt={badge.alt}
            className="h-20 w-20 rounded-full object-cover"
            loading="lazy"
          />
        ))}
      </div>
    </section>
  );
}
