import { Badge } from "@/shared/components/ui/badge";
import { AlertCircle, Briefcase, Clock, Users } from "lucide-react";

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
  return (
    <Badge
      variant="outline"
      className="bg-black-50 text-xs font-medium px-2 py-0.5 h-6 rounded-lg gap-1.5"
    >
      <Briefcase className="size-3" />
      {category}
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
