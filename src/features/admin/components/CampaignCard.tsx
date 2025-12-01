import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import type { CampaignData } from "@/features/campaigns/hooks/useAllCampaigns";
import {
  CampaignStatusBadge,
  CampaignTimelineBadge,
  CategoryBadge,
  ContributorsBadge,
  VerificationBadge,
} from "@/features/campaigns/components/CampaignBadges";
import { getCampaignStatusInfo } from "@/features/campaigns/utils/campaignStatus";
import { Check, X } from "lucide-react";
import { formatUsdLocaleFromMicros } from "@/shared/utils/currency";

/**
 * Format address for display (0x36...c088)
 * Returns fallback message if address is missing or invalid
 */
function formatAddress(address: string | null | undefined): string {
  if (!address || address.length < 10) return "Not available";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

interface CampaignCardProps {
  campaign: CampaignData;
  isVerified: boolean;
  isProcessing: boolean;
  onVerify: () => void;
  onUnverify: () => void;
  canTakeAction: boolean;
  raisedUsdMicro?: bigint;
  supportersCount?: number;
}

export function CampaignCard({
  campaign,
  isVerified,
  isProcessing,
  onVerify,
  onUnverify,
  canTakeAction,
  raisedUsdMicro,
  supportersCount,
}: CampaignCardProps) {
  const statusInfo = getCampaignStatusInfo(
    campaign.startDateMs,
    campaign.endDateMs,
    campaign.isActive,
    campaign.isDeleted,
  );

  const raisedValue = raisedUsdMicro ?? 0n;
  const supporters =
    typeof supportersCount === "number" && Number.isFinite(supportersCount)
      ? Math.max(0, supportersCount)
      : 0;
  const fundingPercent =
    campaign.fundingGoalUsdMicro > 0n
      ? Math.min(
          100,
          Number((raisedValue * 100n) / campaign.fundingGoalUsdMicro),
        )
      : 0;
  const formattedRaised = formatUsdLocaleFromMicros(raisedValue);

  return (
    <div className="bg-white-100 border border-black-50 rounded-3xl p-6 flex flex-col gap-6">
      {/* Header with badges */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <CampaignStatusBadge
          status={statusInfo.status}
          label={statusInfo.label}
        />
        <CampaignTimelineBadge
          label={statusInfo.dateLabel}
          value={statusInfo.dateValue}
          iconName={statusInfo.timelineIcon}
        />
      </div>

      {/* Campaign content */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold text-black-500 leading-relaxed">
            {campaign.name}
          </h3>
          <p className="text-base text-black-400 leading-relaxed">
            {campaign.shortDescription}
          </p>

          {/* Verification badge */}
          <div className="flex items-center gap-2">
            <VerificationBadge isVerified={isVerified} />
          </div>
        </div>
      </div>

      <Separator />

      {/* Publisher and metadata */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col leading-relaxed">
            <p className="text-xs text-black-200">Published by</p>
            <p className="text-sm font-medium text-black-500">
              {formatAddress(campaign.creatorAddress)}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryBadge category={campaign.category} />
            <ContributorsBadge contributorsCount={supporters} />
          </div>
        </div>

        {/* Funding progress */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-base leading-relaxed">
            <span className="font-semibold text-black-500">
              {`$${formattedRaised} raised`}
            </span>
            <span className="text-black-500">
              Goal {formatUsdLocaleFromMicros(campaign.fundingGoalUsdMicro)}
            </span>
            <span className="flex-1 text-right text-black-500">
              {fundingPercent}% funded
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Action section */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-base text-black-500">
          Take Action
        </span>
        {canTakeAction && (
          <>
            {isVerified ? (
              <Button
                onClick={onUnverify}
                disabled={isProcessing}
                className="bg-destructive text-destructive-foreground rounded-lg px-6 py-2.5 gap-2 min-h-[40px]"
              >
                <X className="w-3.5 h-3.5" />
                Unverify
              </Button>
            ) : (
              <Button
                onClick={onVerify}
                disabled={isProcessing}
                className="bg-sgreen-700 text-white-50 rounded-lg px-6 py-2.5 gap-2 min-h-[40px] hover:bg-sgreen-800"
              >
                <Check className="w-3.5 h-3.5" />
                Verify
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
