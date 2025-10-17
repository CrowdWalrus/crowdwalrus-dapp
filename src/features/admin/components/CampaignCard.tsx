import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import type { CampaignData } from "@/features/campaigns/hooks/useMyCampaigns";
import {
  CampaignStatusBadge,
  CampaignTimelineBadge,
  CategoryBadge,
  VerificationBadge,
} from "@/features/campaigns/components/CampaignBadges";
import { getCampaignStatusInfo } from "@/features/campaigns/utils/campaignStatus";
import { Badge } from "@/shared/components/ui/badge";
import { Check, Users, X } from "lucide-react";

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
}

export function CampaignCard({
  campaign,
  isVerified,
  isProcessing,
  onVerify,
  onUnverify,
  canTakeAction,
}: CampaignCardProps) {
  const statusInfo = getCampaignStatusInfo(
    campaign.startDateMs,
    campaign.endDateMs,
    campaign.isActive,
    campaign.isDeleted,
  );

  // Calculate funding percentage (placeholder until raised value available)
  const fundingGoalValue = Number.parseFloat(campaign.fundingGoal) || 0;
  const fundingPercent = 0;

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
            <Badge className="bg-white-600 border-white-600 rounded-lg px-2 py-0.5 gap-1.5 hover:bg-white-700 text-black-500">
              <Users className="w-3 h-3" />
              <span className="text-xs font-medium">
                {campaign.nextUpdateSeq}
              </span>
            </Badge>
          </div>
        </div>

        {/* Funding progress */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-base leading-relaxed">
            <span className="font-semibold text-black-500">$0 raised</span>
            <span className="text-black-500">
              Goal ${fundingGoalValue.toLocaleString()}
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
