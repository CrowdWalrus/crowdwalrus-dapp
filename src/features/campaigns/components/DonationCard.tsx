/**
 * Donation Card Component
 * Campaign contribution and progress display
 */

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { Share2, ChevronDown } from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { StartsBadge, VerificationBadge } from "./CampaignBadges";

interface DonationCardProps {
  campaignId: string;
  isVerified: boolean;
  startDateMs: number;
  amountRaised: number;
  contributorsCount: number;
  fundingGoal: number;
  recipientAddress: string;
  isActive: boolean;
}

export function DonationCard({
  isVerified,
  startDateMs,
  amountRaised,
  contributorsCount,
  fundingGoal,
  recipientAddress,
  isActive,
}: DonationCardProps) {
  const currentAccount = useCurrentAccount();
  const [contributionAmount, setContributionAmount] = useState("");

  // Calculate funding percentage
  const fundingPercentage =
    fundingGoal > 0 ? (amountRaised / fundingGoal) * 100 : 0;

  // Format start date
  const formatStartDate = (timestampMs: number) => {
    if (!Number.isFinite(timestampMs) || timestampMs <= 0) {
      return "Unknown";
    }
    return new Date(timestampMs).toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  // Mock balance - in real app, fetch from wallet
  const balance = "100.09";

  const formattedStartDate = formatStartDate(startDateMs);
  const formattedStartDateUtc = Number.isFinite(startDateMs)
    ? new Date(startDateMs).toUTCString()
    : "Unknown";

  return (
    <div className="bg-white rounded-3xl p-10 flex flex-col gap-6 w-full shadow-[0px_0px_16px_0px_rgba(0,0,0,0.16)]">
      {/* Verification Badge */}
      <div className="flex items-start">
        <VerificationBadge isVerified={isVerified} />
      </div>

      {/* Start Date */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-6">
          <StartsBadge formattedDate={formattedStartDate} />
        </div>
        <p className="text-xs text-muted-foreground">({formattedStartDateUtc})</p>
      </div>

      {/* Amount Raised */}
      <div className="flex flex-col gap-2">
        <h2 className="font-['Inter_Tight'] text-[40px] font-bold leading-[1.2] tracking-[0.4px] ">
          ${amountRaised.toLocaleString()} raised
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
          <p className="font-semibold">Goal ${fundingGoal.toLocaleString()}</p>
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
              className="flex-1 h-[54px] bg-white border border-[#e7e7e8] border-r-0 rounded-tl-lg rounded-bl-lg px-4 text-lg font-semibold  placeholder:text-[#b4b5b9] focus:outline-none focus:ring-2 focus:ring-[#613dff] opacity-50"
              disabled={!isActive || !currentAccount}
            />
            <div className="h-[54px] bg-white border border-[#e7e7e8] rounded-tr-lg rounded-br-lg px-3 flex items-center gap-2 opacity-50">
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
        <Button
          className="w-full h-10 bg-primary text-primary-foreground  text-sm font-medium tracking-[0.07px] rounded-lg hover:bg-primary/90 opacity-50"
          disabled={!isActive || !currentAccount || !contributionAmount}
        >
          Contribute Now
        </Button>
        <Button
          variant="secondary"
          className="w-full h-10 bg-[#efecff] text-[#613dff]  text-sm font-medium tracking-[0.07px] rounded-lg hover:bg-[#e0d9ff] gap-2"
        >
          Share
          <Share2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
