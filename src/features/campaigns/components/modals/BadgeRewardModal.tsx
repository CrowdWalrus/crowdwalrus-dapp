import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { ROUTES } from "@/shared/config/routes";
import { getBadgeImagePath } from "@/shared/utils/badges";

export interface BadgeRewardItem {
  id: string;
  level: number;
  objectId?: string;
}

interface BadgeRewardModalProps {
  open: boolean;
  badges: BadgeRewardItem[];
  profileAddress?: string | null;
  onClose: () => void;
}

export function BadgeRewardModal({
  open,
  badges,
  profileAddress,
  onClose,
}: BadgeRewardModalProps) {
  const safeOpen = open && badges.length > 0;
  const sortedBadges = [...badges].sort((a, b) => a.level - b.level);
  const levelsSummary = formatLevels(sortedBadges.map((badge) => badge.level));
  const profilePath = profileAddress
    ? ROUTES.PROFILE_DETAIL.replace(":address", profileAddress)
    : null;

  const handleViewProfile = () => {
    if (!profilePath) {
      return;
    }
    window.open(profilePath, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={safeOpen} onOpenChange={(state) => (!state ? onClose() : undefined)}>
      <DialogContent className="max-w-md px-10 py-12 rounded-2xl bg-white [&>button]:hidden">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4">
            {sortedBadges.map((badge) => (
              <BadgeRewardPreview key={badge.id} badge={badge} />
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <DialogTitle className="text-2xl font-semibold text-black-500">
              Congratulations 🥳
            </DialogTitle>
            <DialogDescription className="text-base text-black-400">
              Here {sortedBadges.length > 1 ? "are" : "is"} your NFT reward
              {sortedBadges.length > 1 ? "s" : ""} for reaching {levelsSummary}.
              The same has been minted and sent to your wallet.
            </DialogDescription>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="ghost"
            className="flex-1 h-10 rounded-lg border border-black-100 bg-white text-black-500 hover:bg-white-200 disabled:border-black-50 disabled:text-black-200"
            type="button"
            disabled={!profilePath}
            onClick={handleViewProfile}
          >
            View your profile
          </Button>
          <Button
            className="flex-1 h-10 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
            type="button"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BadgeRewardPreview({ badge }: { badge: BadgeRewardItem }) {
  const [hasError, setHasError] = useState(false);
  const imageSrc = getBadgeImagePath(badge.level);

  if (!imageSrc || hasError) {
    return (
      <div className="flex size-32 items-center justify-center rounded-full bg-black-50 text-sm font-semibold text-black-300">
        Level {badge.level}
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={`CrowdWalrus badge level ${badge.level}`}
      className="size-32 rounded-full object-cover"
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
}

function formatLevels(levels: number[]): string {
  const unique = Array.from(new Set(levels)).sort((a, b) => a - b);
  if (!unique.length) {
    return "your new level";
  }
  if (unique.length === 1) {
    return `Level ${unique[0]}`;
  }
  if (unique.length === 2) {
    return `Levels ${unique[0]} and ${unique[1]}`;
  }
  const last = unique.pop();
  return `Levels ${unique.join(", ")} and ${last}`;
}
