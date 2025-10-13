import { Badge } from "@/shared/components/ui/badge";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Building2,
  Clock,
  Cpu,
  GraduationCap,
  Handshake,
  HeartPulse,
  Leaf,
  Palette,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";

type CategoryKey =
  | "arts"
  | "community"
  | "education"
  | "environment"
  | "health"
  | "ngo"
  | "tech"
  | "other";

const CATEGORY_BADGE_CONFIG: Record<
  CategoryKey,
  { Icon: LucideIcon; label: string }
> = {
  arts: { Icon: Palette, label: "Art & Culture" },
  community: { Icon: Handshake, label: "Community" },
  education: { Icon: GraduationCap, label: "Education" },
  environment: { Icon: Leaf, label: "Environment & Energy" },
  health: { Icon: HeartPulse, label: "Health & Wellness" },
  ngo: { Icon: Building2, label: "NGO / NonProfits" },
  tech: { Icon: Cpu, label: "Technology" },
  other: { Icon: Sparkles, label: "Others" },
};

const DEFAULT_CATEGORY_ICON: LucideIcon = Tag;

export function OpenSoonBadge() {
  return (
    <Badge
      variant="outline"
      className="bg-orange-50 border-orange-500 text-orange-600 text-xs px-2 py-0.5 h-6 rounded-lg gap-1.5"
    >
      <Clock className="size-3" />
      Open Soon
    </Badge>
  );
}

interface StartsInBadgeProps {
  daysUntilStart: number;
}

export function StartsInBadge({ daysUntilStart }: StartsInBadgeProps) {
  return (
    <Badge
      variant="outline"
      className="bg-black-50 text-xs px-2 py-0.5 h-6 rounded-lg gap-1.5"
    >
      <Clock className="size-3" />
      Starts in {daysUntilStart} days
    </Badge>
  );
}

interface CategoryBadgeProps {
  category: string;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const normalizedCategory = category.trim().toLowerCase();
  const config = CATEGORY_BADGE_CONFIG[normalizedCategory as CategoryKey];
  const IconComponent = config?.Icon ?? DEFAULT_CATEGORY_ICON;
  const label =
    config?.label ??
    category
      .trim()
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  return (
    <Badge
      variant="outline"
      className="bg-black-50 text-xs font-medium px-2 py-0.5 h-6 rounded-lg gap-1.5"
    >
      <IconComponent className="size-3" />
      {label || "Campaign"}
    </Badge>
  );
}

interface ContributorsBadgeProps {
  contributorsCount: number;
}

export function ContributorsBadge({
  contributorsCount,
}: ContributorsBadgeProps) {
  return (
    <Badge
      variant="outline"
      className="bg-black-50 text-xs px-2 py-0.5 h-6 rounded-lg gap-1.5"
    >
      <Users className="size-3" />
      {contributorsCount}
    </Badge>
  );
}

interface VerificationBadgeProps {
  isVerified: boolean;
}

export function VerificationBadge({ isVerified }: VerificationBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`text-xs px-2 py-0.5 h-6 rounded-lg gap-1.5 border-transparent ${
        isVerified ? "bg-green-600 text-white" : "bg-orange-600 text-white"
      }`}
    >
      <AlertCircle className="size-3" />
      {isVerified ? "Verified" : "Not Verified"}
    </Badge>
  );
}

interface StartsBadgeProps {
  formattedDate: string;
}

export function StartsBadge({ formattedDate }: StartsBadgeProps) {
  return (
    <Badge
      variant="outline"
      className="bg-black-50 border-transparent text-black-500 text-xs font-medium leading-[1.5] tracking-[0.18px] px-2 py-0.5 h-6 rounded-lg gap-1.5"
    >
      <Clock className="size-3" />
      Starts {formattedDate}
    </Badge>
  );
}
