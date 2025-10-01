import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

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
    <section className="mb-12">
      <h2 className="text-2xl font-semibold mb-8">Funding Target *</h2>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="target-amount">Target amount (SUI)</Label>
          <Input
            id="target-amount"
            type="number"
            placeholder="Enter target amount"
            value={targetAmount}
            onChange={(e) => onTargetAmountChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wallet-address">Recipient wallet address *</Label>
          <Input
            id="wallet-address"
            placeholder="0x..."
            className="font-mono"
            value={walletAddress}
            onChange={(e) => onWalletAddressChange(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            This is the wallet that will receive all donation funds
          </p>
        </div>
      </div>
    </section>
  );
}
