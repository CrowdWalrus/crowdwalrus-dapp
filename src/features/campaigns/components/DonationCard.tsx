/**
 * Donation Card Component
 * Campaign contribution and progress display
 */

import { useState } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { Clock, AlertCircle, Share2, ChevronDown } from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit";

interface DonationCardProps {
  campaignId: string;
  validated: boolean;
  startDate: number;
  amountRaised: number;
  contributorsCount: number;
  fundingGoal: number;
  recipientAddress: string;
  isActive: boolean;
}

export function DonationCard({
  validated,
  startDate,
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
  const formatStartDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Mock balance - in real app, fetch from wallet
  const balance = "100.09";

  return (
    <div className="bg-white rounded-[24px] shadow-[0px_0px_16px_0px_rgba(0,0,0,0.16)] p-10 flex flex-col gap-6 w-full">
      {/* Verification Badge */}
      <div className="flex items-start">
        <Badge
          variant="outline"
          className={` text-xs font-medium leading-[1.5] tracking-[0.18px] px-2 py-0.5 h-6 rounded-lg gap-1.5 border-transparent ${
            validated ? "bg-green-600 text-white" : "bg-[#e6a01f] text-white"
          }`}
        >
          <AlertCircle className="size-3" />
          {validated ? "Verified" : "Not Verified"}
        </Badge>
      </div>

      {/* Start Date */}
      <div className="flex items-center gap-6">
        <Badge
          variant="outline"
          className="bg-[#e7e7e8] border-transparent text-[#0c0f1c]  text-xs font-medium leading-[1.5] tracking-[0.18px] px-2 py-0.5 h-6 rounded-lg gap-1.5"
        >
          <Clock className="size-3" />
          Starts {formatStartDate(startDate)}
        </Badge>
      </div>

      {/* Amount Raised */}
      <div className="flex flex-col gap-2">
        <h2 className="font-['Inter_Tight'] text-[40px] font-bold leading-[1.2] tracking-[0.4px] text-[#0c0f1c]">
          ${amountRaised.toLocaleString()} raised
        </h2>
        <p className="font-['Inter'] text-xl font-normal leading-[1.6] text-[#0c0f1c]">
          from {contributorsCount} contributors
        </p>
      </div>

      {/* Progress Bar */}
      <div className="flex flex-col gap-4 w-full">
        <div className="h-2.5 w-full bg-[#e7e7e8] rounded-[10px] overflow-hidden relative">
          {fundingPercentage > 0 && (
            <div
              className="h-full bg-gradient-to-r from-[#613dff] to-[#8b6fff] rounded-[10px] absolute top-0 left-0"
              style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
            />
          )}
        </div>
        <div className="flex items-center justify-between text-xl leading-[1.6] text-[#0c0f1c]">
          <p className="font-['Inter'] font-semibold">
            Goal ${fundingGoal.toLocaleString()}
          </p>
          <p className="font-['Inter'] font-normal">
            {fundingPercentage.toFixed(0)}% funded
          </p>
        </div>
      </div>

      {/* Recipient Address */}
      <div className="flex flex-col gap-2">
        <p className="font-['Inter'] text-sm font-normal leading-[1.6] text-[#3d3f49]">
          Recipient Address
        </p>
        <p className="font-['Inter'] text-base font-medium leading-[1.6] text-[#0c0f1c] break-all">
          {recipientAddress}
        </p>
      </div>

      <Separator className="bg-[#e1e1e1]" />

      {/* Contribution Form */}
      <div className="flex flex-col gap-4 w-full">
        <p className="font-['Inter'] text-base font-semibold leading-[1.6] text-[#0c0f1c]">
          Make your contribution
        </p>

        <div className="flex flex-col gap-2 w-full">
          {/* Input with Currency Selector */}
          <div className="flex items-center w-full">
            <input
              type="number"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 h-[54px] bg-white border border-[#e7e7e8] border-r-0 rounded-tl-lg rounded-bl-lg px-4 font-['Inter'] text-lg font-semibold text-[#0c0f1c] placeholder:text-[#b4b5b9] focus:outline-none focus:ring-2 focus:ring-[#613dff] opacity-50"
              disabled={!isActive || !currentAccount}
            />
            <div className="h-[54px] bg-white border border-[#e7e7e8] rounded-tr-lg rounded-br-lg px-3 flex items-center gap-2 opacity-50">
              <div className="size-5 rounded-full bg-[#006ce9] flex items-center justify-center">
                <span className="text-white text-xs font-bold">S</span>
              </div>
              <span className="font-['Inter'] text-sm font-semibold text-foreground">
                SUI
              </span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </div>
          </div>

          {/* Balance Display */}
          <div className="flex items-center gap-1 text-xs leading-[1.6] text-[#3d3f49]">
            <span className="font-['Inter'] font-normal">Balance:</span>
            <span className="font-['Inter'] font-semibold">{balance} SUI</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 w-full">
        <Button
          className="w-full h-10 bg-[#613dff] text-white  text-sm font-medium tracking-[0.07px] rounded-lg hover:bg-[#4f2ecc] opacity-50"
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
