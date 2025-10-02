import { Input } from "@/shared/components/ui/input";
import { DollarSign } from "lucide-react";

interface CampaignFundingTargetSectionProps {
  targetAmount: string;
  walletAddress: string;
  onTargetAmountChange: (amount: string) => void;
  onWalletAddressChange: (address: string) => void;
}

export function CampaignFundingTargetSection({
  targetAmount,
  walletAddress,
  onTargetAmountChange,
  onWalletAddressChange,
}: CampaignFundingTargetSectionProps) {
  return (
    <section className="flex flex-col gap-8">
      <h2 className="font-bold text-2xl leading-[1.6]">
        Funding Target <span className="font-normal text-red-300">*</span>
      </h2>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <label
            htmlFor="target-amount"
            className="font-medium text-base leading-[1.6]"
          >
            Add a max funding amount for your campaign
          </label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#737373]" />
            <Input
              id="target-amount"
              type="number"
              placeholder="Enter amount"
              value={targetAmount}
              onChange={(e) => onTargetAmountChange(e.target.value)}
              className="pl-12"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-4">
            <label
              htmlFor="wallet-address"
              className="font-medium text-base leading-[1.6]"
            >
              Add a funding Sui address
            </label>
            <Input
              id="wallet-address"
              placeholder="0x8894E0a0c962CB723c1976a4421c95949bE2D4E3"
              value={walletAddress}
              onChange={(e) => onWalletAddressChange(e.target.value)}
            />
          </div>
          <p className="font-normal text-xs leading-[1.6] text-[#8f9197]">
            This is the wallet that will receive all donation funds
          </p>
        </div>
      </div>
    </section>
  );
}
