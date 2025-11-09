/**
 * Donation Card Component
 * Campaign contribution and progress display
 */

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { Share2, ChevronDown, Clock } from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { VerificationBadge } from "./CampaignBadges";
import { formatUsdLocaleFromMicros } from "@/shared/utils/currency";

interface DonationCardProps {
  campaignId: string;
  isVerified: boolean;
  startDateMs: number;
  endDateMs: number;
  raisedUsdMicro: bigint;
  contributorsCount: number;
  fundingGoalUsdMicro: bigint;
  recipientAddress: string;
  isActive: boolean;
}

export function DonationCard({
  isVerified,
  startDateMs,
  endDateMs,
  raisedUsdMicro,
  contributorsCount,
  fundingGoalUsdMicro,
  recipientAddress,
  isActive,
}: DonationCardProps) {
  const currentAccount = useCurrentAccount();
  const [contributionAmount, setContributionAmount] = useState("");
  const formattedRaised = formatUsdLocaleFromMicros(raisedUsdMicro);

  const formatDate = (timestampMs: number) => {
    if (!Number.isFinite(timestampMs) || timestampMs <= 0) {
      return null;
    }
    const formatter = new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const parts = formatter.formatToParts(new Date(timestampMs));
    const partValue = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? "";
    const day = partValue("day");
    const month = partValue("month");
    const year = partValue("year");
    if (!day || !month || !year) {
      return formatter.format(new Date(timestampMs));
    }
    return `${day} ${month} ${year}`;
  };

  // Calculate funding percentage
  const fundingPercentage =
    fundingGoalUsdMicro > 0n
      ? Number((raisedUsdMicro * 100n) / fundingGoalUsdMicro)
      : 0;

  const nowMs = Date.now();
  const hasValidStart = Number.isFinite(startDateMs) && startDateMs > 0;
  const hasValidEnd = Number.isFinite(endDateMs) && endDateMs > 0;
  const hasStarted = hasValidStart && startDateMs <= nowMs;
  const startDateLabel = hasValidStart ? formatDate(startDateMs) : null;
  const endDateLabel = hasValidEnd ? formatDate(endDateMs) : null;

  // Mock balance - in real app, fetch from wallet
  const balance = "100.09";

  return (
    <div className="bg-white rounded-3xl p-10 flex flex-col gap-6 w-full shadow-[0px_0px_16px_0px_rgba(0,0,0,0.16)]">
      {/* Verification Badge */}
      <div className="flex items-start">
        <VerificationBadge isVerified={isVerified} />
      </div>

      {/* Timeline */}
      {(startDateLabel || endDateLabel) && (
        <div
          className={`flex flex-wrap items-center gap-4 ${
            hasStarted && endDateLabel ? "justify-between" : "justify-start"
          }`}
        >
          {startDateLabel && (
            <Badge
              variant="outline"
              className="flex items-center bg-black-50 border-transparent text-black-500 text-xs font-medium leading-[1.5] tracking-[0.18px] px-2 py-0.5 h-6 rounded-lg gap-1.5"
            >
              <Clock className="size-3" />
              {hasStarted
                ? `Started on ${startDateLabel}`
                : `Starts ${startDateLabel}`}
            </Badge>
          )}
          {hasStarted && endDateLabel && (
            <Badge
              variant="outline"
              className="flex items-center bg-black-50 border-transparent text-black-500 text-xs font-medium leading-[1.5] tracking-[0.18px] px-2 py-0.5 h-6 rounded-lg gap-1.5"
            >
              <Clock className="size-3" />
              {`Ends on ${endDateLabel}`}
            </Badge>
          )}
        </div>
      )}

      {/* Amount Raised */}
      <div className="flex flex-col gap-2">
        <h2 className="font-['Inter_Tight'] text-[40px] font-bold leading-[1.2] tracking-[0.4px] ">
          {`$${formattedRaised} raised`}
        </h2>
        <p className="text-xl  ">from {contributorsCount} contributors</p>
      </div>

      {/* Progress Bar */}
      <div className="flex flex-col gap-4 w-full">
        <div className="h-2.5 w-full bg-black-50 rounded-[10px] overflow-hidden relative">
          {fundingPercentage > 0 && (
            <div
              className="h-full bg-green-700 rounded-[10px] absolute top-0 left-0"
              style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
            />
          )}
        </div>
        <div className="flex items-center justify-between text-xl ">
          <p className="font-semibold">
            Goal {formatUsdLocaleFromMicros(fundingGoalUsdMicro)}
          </p>
          <p>{fundingPercentage.toFixed(0)}% funded</p>
        </div>
      </div>

      {/* Recipient Address */}
      <div className="flex flex-col gap-2">
        <p className="text-sm  text-black-400">Recipient Address</p>
        <p className="text-base font-medium  break-all">{recipientAddress}</p>
      </div>

      <Separator className="bg-white-600" />

      {/* Contribution Form */}
      <div className="flex flex-col gap-4 w-full">
        <p className="text-base font-semibold ">Make your contribution</p>

        <div className="flex flex-col gap-2 w-full">
          {/* Input with Currency Selector */}
          <div className="flex items-center w-full">
            <input
              type="number"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 h-[54px] bg-white border border-black-50 border-r-0 rounded-tl-lg rounded-bl-lg px-4 text-lg font-semibold  placeholder:text-black-100 focus:outline-none focus:ring-2 focus:ring-blue-500 opacity-50"
              disabled={!isActive || !currentAccount}
            />
            <div className="h-[54px] bg-white border border-black-50 rounded-tr-lg rounded-br-lg px-3 flex items-center gap-2 opacity-50">
              <div className="size-5 rounded-full bg-[#006ce9] flex items-center justify-center">
                <span className="text-white text-xs font-bold">S</span>
              </div>
              <span className="text-sm font-semibold text-foreground">SUI</span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </div>
          </div>

          {/* Balance Display */}
          <div className="flex items-center gap-1 text-xs text-black-400">
            <span className="">Balance:</span>
            <span className="font-semibold">{balance} SUI</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 w-full">
        {/* TODO(Phase 2 - Task 5): enable once donation flows & price oracle are wired */}
        <Button
          className="w-full h-10 bg-primary text-primary-foreground  text-sm font-medium tracking-[0.07px] rounded-lg hover:bg-primary/90 opacity-50"
          disabled={!isActive || !currentAccount || !contributionAmount}
        >
          Contribute Now
        </Button>
        <Button
          variant="secondary"
          className="w-full h-10 bg-blue-50 text-blue-500  text-sm font-medium tracking-[0.07px] rounded-lg hover:bg-[#e0d9ff] gap-2"
        >
          Share
          <Share2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
