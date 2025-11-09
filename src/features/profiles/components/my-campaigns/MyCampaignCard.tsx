import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CampaignStatusBadge,
  CampaignTimelineBadge,
  CategoriesBadgeGroup,
  ContributorsBadge,
  VerificationBadge,
} from "@/features/campaigns/components/CampaignBadges";
import type { CampaignData } from "@/features/campaigns/hooks/useAllCampaigns";
import { getCampaignStatusInfo } from "@/features/campaigns/utils/campaignStatus";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { cn } from "@/shared/lib/utils";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { formatUsdLocaleFromMicros } from "@/shared/utils/currency";

export type MyCampaignCardActionVariant =
  | "primary"
  | "secondary"
  | "neutral"
  | "warning"
  | "success";

export interface MyCampaignCardAction {
  id: string;
  label: string;
  icon: LucideIcon;
  variant: MyCampaignCardActionVariant;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  loading?: boolean;
  suffix?: ReactNode;
}

export interface MyCampaignCardProps {
  campaign: CampaignData;
  actions: MyCampaignCardAction[];
  raisedAmountUsdMicro?: bigint;
  supportersCount?: number;
  className?: string;
}

const ACTION_BASE_CLASS =
  "w-full h-10 rounded-lg px-6 text-sm font-medium tracking-[0.07px] justify-center transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black-500";

const ACTION_VARIANT_CLASS: Record<MyCampaignCardActionVariant, string> = {
  primary:
    "bg-blue-500 text-white-50 hover:bg-blue-600 focus-visible:ring-blue-500 border border-blue-500",
  secondary:
    "bg-white-50 text-black-500 border border-black-50 hover:bg-white-100",
  neutral:
    "bg-white-500 text-black-500 border border-black-50 hover:bg-white-400",
  warning:
    "bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100",
  success:
    "bg-sgreen-50 text-sgreen-700 border border-sgreen-200 hover:bg-sgreen-100",
};

const CAMPAIGN_PLACEHOLDER_SUPPORTERS = 0;

const formatAddress = (address?: string | null): string => {
  if (!address) {
    return "Not available";
  }

  if (address.length <= 10) {
    return address;
  }

  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

export function MyCampaignCard({
  campaign,
  actions,
  raisedAmountUsdMicro,
  supportersCount = CAMPAIGN_PLACEHOLDER_SUPPORTERS,
  className,
}: MyCampaignCardProps) {
  const statusInfo = getCampaignStatusInfo(
    campaign.startDateMs,
    campaign.endDateMs,
    campaign.isActive,
    campaign.isDeleted,
  );

  const raisedUsdMicro = raisedAmountUsdMicro ?? 0n;
  const fundingPercentageRaw =
    campaign.fundingGoalUsdMicro > 0n
      ? Number((raisedUsdMicro * 100n) / campaign.fundingGoalUsdMicro)
      : 0;
  const fundingPercentage = Math.min(
    100,
    Math.max(0, fundingPercentageRaw),
  );
  const formattedGoal = formatUsdLocaleFromMicros(
    campaign.fundingGoalUsdMicro,
  );
  const formattedRaised = formatUsdLocaleFromMicros(raisedUsdMicro);
  const resolvedSupportersCount =
    typeof supportersCount === "number" && Number.isFinite(supportersCount)
      ? Math.max(0, supportersCount)
      : CAMPAIGN_PLACEHOLDER_SUPPORTERS;

  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-3xl border border-black-50 bg-white px-6 py-6 shadow-sm md:flex-row md:items-stretch md:gap-0",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-6 md:pr-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CampaignStatusBadge
              status={statusInfo.status}
              label={statusInfo.label}
            />
            <CampaignTimelineBadge
              label={statusInfo.dateLabel}
              value={statusInfo.dateValue}
            />
          </div>

          <div className="flex flex-col items-start gap-3">
            <h3 className="text-xl font-semibold leading-tight text-black-500">
              {campaign.name}
            </h3>
            <p className="text-base leading-relaxed text-black-400">
              {campaign.shortDescription}
            </p>
            <VerificationBadge
              isVerified={campaign.isVerified}
              className="self-start"
            />
          </div>
        </div>

        <Separator className="bg-white-600" />

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col leading-relaxed">
              <span className="text-xs text-black-200">Published by</span>
              <span className="text-sm font-medium text-black-500">
                {formatAddress(campaign.creatorAddress)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <CategoriesBadgeGroup categories={campaign.category ?? ""} />
              <ContributorsBadge
                contributorsCount={resolvedSupportersCount}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {statusInfo.showProgress ? (
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-black-50">
                <div
                  className="h-full rounded-full bg-sgreen-600 transition-all"
                  style={{ width: `${fundingPercentage}%` }}
                  aria-hidden="true"
                />
              </div>
            ) : null}

            <div className="flex flex-col gap-1 text-base leading-relaxed text-black-500 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-1">
                <span className="font-semibold">
                  {`$${formattedRaised} raised`}
                </span>
                <span>Goal {formattedGoal}</span>
              </div>
              <span>{fundingPercentage}% funded</span>
            </div>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="hidden md:block md:h-auto md:w-px md:self-stretch md:bg-black-50"
      />

      <div className="flex w-full flex-col gap-4 rounded-2xl border border-white-600 bg-white-50 p-4 md:w-auto md:flex-none md:border-0 md:bg-transparent md:p-0 md:pl-6">
        <h4 className="text-base font-semibold text-black-500">
          Quick Actions
        </h4>

        <div className="flex flex-col gap-3">
          {actions.map(
            ({
              id,
              label,
              icon: Icon,
              variant,
              onClick,
              href,
              disabled,
              loading,
              suffix,
            }) => {
              const content = (
                <div className="flex w-full items-center justify-center gap-2">
                  {loading ? (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Icon className="size-4" aria-hidden="true" />
                  )}
                  <span>{label}</span>
                  {suffix}
                </div>
              );

              const buttonClass = cn(
                ACTION_BASE_CLASS,
                ACTION_VARIANT_CLASS[variant] ?? ACTION_VARIANT_CLASS.neutral,
              );

              if (href) {
                return (
                  <Button
                    key={id}
                    asChild
                    className={buttonClass}
                    disabled={disabled || loading}
                  >
                    <Link to={href} aria-label={label}>
                      {content}
                    </Link>
                  </Button>
                );
              }

              return (
                <Button
                  key={id}
                  type="button"
                  onClick={onClick}
                  className={buttonClass}
                  disabled={disabled || loading}
                >
                  {content}
                </Button>
              );
            },
          )}
        </div>
      </div>
    </div>
  );
}
