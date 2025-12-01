import {
  AlertCircle,
  Building2,
  Clock,
  Cpu,
  GraduationCap,
  Handshake,
  HeartPulse,
  Hourglass,
  Leaf,
  Palette,
  Sparkles,
  Tag,
  CheckCircle,
  XCircle,
  HandCoins,
  Timer,
  ClockFading,
  User,
  CheckIcon,
  CircleCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import type { CampaignStatus } from "@/features/campaigns/utils/campaignStatus";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

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
  ngo: { Icon: Building2, label: "NGO / Nonprofits" },
  tech: { Icon: Cpu, label: "Technology" },
  other: { Icon: Sparkles, label: "Others" },
};

const DEFAULT_CATEGORY_ICON: LucideIcon = Tag;
const BADGE_TEXT_CLASS =
  "text-xs font-medium leading-[1.5] tracking-[0.18px] px-2 py-0.5 h-6 rounded-lg gap-1.5";

const STATUS_BADGE_CONFIG: Record<
  CampaignStatus,
  { Icon: LucideIcon; className: string }
> = {
  open_soon: {
    Icon: Clock,
    className: "bg-orange-50 border-orange-500 text-orange-600",
  },
  funding: {
    Icon: HandCoins,
    className: "bg-sgreen-50 border-sgreen-500 text-sgreen-700",
  },
  active: {
    Icon: CheckCircle,
    className: "bg-sky-50 border-sky-500 text-sky-600",
  },
  ended: {
    Icon: XCircle,
    className: "bg-red-50 border-red-500 text-red-600",
  },
};

export function OpenSoonBadge() {
  return (
    <Badge
      variant="outline"
      className={cn(
        BADGE_TEXT_CLASS,
        "bg-orange-50 border-orange-500 text-orange-600",
      )}
    >
      <ClockFading className="size-3" />
      Open Soon
    </Badge>
  );
}

interface StartsInBadgeProps {
  daysUntilStart: number;
}

export function StartsInBadge({ daysUntilStart }: StartsInBadgeProps) {
  return (
    <Badge variant="outline" className={cn(BADGE_TEXT_CLASS, "bg-black-50")}>
      <Hourglass className="size-3" />
      Starts in {daysUntilStart} days
    </Badge>
  );
}

interface EndsInBadgeProps {
  daysUntilEnd: number;
}

export function EndsInBadge({ daysUntilEnd }: EndsInBadgeProps) {
  return (
    <Badge variant="outline" className={cn(BADGE_TEXT_CLASS, "bg-black-50")}>
      <Timer className="size-3" />
      Ends in {daysUntilEnd} days
    </Badge>
  );
}

interface CampaignStatusBadgeProps {
  status: CampaignStatus;
  label: string;
  className?: string;
}

export function CampaignStatusBadge({
  status,
  label,
  className,
}: CampaignStatusBadgeProps) {
  const config = STATUS_BADGE_CONFIG[status] ?? STATUS_BADGE_CONFIG.ended;
  const IconComponent = config.Icon;

  return (
    <Badge
      variant="outline"
      className={cn(BADGE_TEXT_CLASS, config.className, className)}
    >
      <IconComponent className="size-3" />
      {label}
    </Badge>
  );
}

interface CampaignTimelineBadgeProps {
  label: string;
  value: string;
  iconName?: "clock" | "check" | "circle-check";
  className?: string;
}

export function CampaignTimelineBadge({
  label,
  value,
  iconName = "clock",
  className,
}: CampaignTimelineBadgeProps) {
  if (!label || !value) {
    return null;
  }

  const IconComponent =
    iconName === "check"
      ? CheckIcon
      : iconName === "circle-check"
        ? CircleCheck
        : Clock;

  return (
    <Badge
      variant="outline"
      className={cn(
        BADGE_TEXT_CLASS,
        "bg-white-500 border-black-50 text-black-500",
        className,
      )}
    >
      <IconComponent className="size-3" />
      <span className="whitespace-nowrap">
        {label} {value}
      </span>
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
    <Badge variant="outline" className={cn(BADGE_TEXT_CLASS, "bg-black-50")}>
      <IconComponent className="size-3" />
      {label || "Campaign"}
    </Badge>
  );
}

interface ContributorsBadgeProps {
  contributorsCount: number | null | undefined;
}

export function ContributorsBadge({
  contributorsCount,
}: ContributorsBadgeProps) {
  const safeContributorsCount =
    typeof contributorsCount === "number" && Number.isFinite(contributorsCount)
      ? Math.max(0, contributorsCount)
      : 0;

  return (
    <Badge
      variant="outline"
      className={cn(
        BADGE_TEXT_CLASS,
        "bg-black-50 border-black-50 text-black-500",
      )}
    >
      <User className="size-3" />
      {safeContributorsCount}
    </Badge>
  );
}

interface VerificationBadgeProps {
  isVerified: boolean;
  className?: string;
}

export function VerificationBadge({
  isVerified,
  className,
}: VerificationBadgeProps) {
  const IconComponent = isVerified ? CheckCircle : AlertCircle;
  const verifiedClasses = "bg-primary text-primary-foreground border-none";
  const unverifiedClasses = "bg-orange-600 text-white-50 border-orange-600";

  return (
    <Badge
      variant="outline"
      className={cn(
        BADGE_TEXT_CLASS,
        isVerified ? verifiedClasses : unverifiedClasses,
        className,
      )}
    >
      <IconComponent className="size-3" />
      {isVerified ? "Verified" : "Not Verified"}
    </Badge>
  );
}

interface CategoriesBadgeGroupProps {
  categories: string;
  maxVisible?: number;
}

/**
 * Displays multiple category badges with overflow handling
 * Shows first N categories, with a "+X more" tooltip for remaining ones
 */
export function CategoriesBadgeGroup({
  categories,
  maxVisible = 1,
}: CategoriesBadgeGroupProps) {
  // Parse comma-separated categories
  const categoryList = categories
    .split(",")
    .map((cat) => cat.trim())
    .filter(Boolean);

  if (categoryList.length === 0) {
    return null;
  }

  // Show all if within limit
  if (categoryList.length <= maxVisible) {
    return (
      <>
        {categoryList.map((category, index) => (
          <CategoryBadge key={`${category}-${index}`} category={category} />
        ))}
      </>
    );
  }

  // Show limited badges + "more" indicator with tooltip
  const visibleCategories = categoryList.slice(0, maxVisible);
  const remainingCategories = categoryList.slice(maxVisible);
  const remainingCount = remainingCategories.length;

  return (
    <>
      {visibleCategories.map((category, index) => (
        <CategoryBadge key={`${category}-${index}`} category={category} />
      ))}
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Badge
              variant="outline"
              className={cn(BADGE_TEXT_CLASS, "bg-black-50 cursor-help")}
            >
              <Tag className="size-3" />+{remainingCount} more
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="flex flex-col gap-1">
            <div className="font-semibold text-xs">All categories:</div>
            <div className="flex flex-wrap gap-1">
              {categoryList.map((category, index) => {
                const normalizedCategory = category.trim().toLowerCase();
                const config =
                  CATEGORY_BADGE_CONFIG[normalizedCategory as CategoryKey];
                const label =
                  config?.label ??
                  category
                    .trim()
                    .split(/[\s_-]+/)
                    .filter(Boolean)
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");
                return (
                  <span
                    key={`tooltip-${category}-${index}`}
                    className="text-xs"
                  >
                    {label}
                    {index < categoryList.length - 1 && ", "}
                  </span>
                );
              })}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </>
  );
}
