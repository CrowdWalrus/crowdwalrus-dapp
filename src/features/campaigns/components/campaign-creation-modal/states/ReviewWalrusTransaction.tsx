/**
 * Review Walrus Transaction Component
 *
 * Shown when: WizardStep.CONFIRM_REGISTER
 *
 * Purpose:
 * - Display storage cost estimation
 * - Show what the user is paying for (WAL tokens for Walrus storage)
 * - Get user confirmation before proceeding with the transaction
 *
 * UI Elements to implement:
 * - Title: "Review Walrus Transaction"
 * - Cost breakdown display (from estimatedCost prop)
 * - Explanation of what storage registration means
 * - "Proceed" button (calls onConfirm)
 * - "Cancel" button (calls onCancel)
 *
 * Design considerations:
 * - Make the cost prominent and clear
 * - Show subsidy information if applicable
 * - Explain storage epochs/duration
 */

import type { StorageCostEstimate } from "@/features/campaigns/types/campaign";
import { useNetworkVariable } from "@/shared/config/networkConfig";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { addDays, format } from "date-fns";

export interface ReviewWalrusTransactionProps {
  /** Storage cost estimation data */
  estimatedCost?: StorageCostEstimate | null;

  /** Called when user clicks "Proceed" */
  onConfirm?: () => void;

  /** Called when user clicks "Cancel" */
  onCancel?: () => void;
}

export const ReviewWalrusTransaction = ({
  estimatedCost,
  onConfirm,
  onCancel,
}: ReviewWalrusTransactionProps) => {
  const epochConfig = useNetworkVariable("epochConfig") as {
    epochDurationDays: number;
    defaultEpochs: number;
    maxEpochs: number;
  };

  const epochs = estimatedCost?.epochs ?? epochConfig.defaultEpochs;
  const totalDays = epochs * epochConfig.epochDurationDays;
  const registrationExpires =
    totalDays > 0
      ? `${format(addDays(new Date(), totalDays), "MMM d, yyyy")} (${totalDays} day${totalDays !== 1 ? "s" : ""})`
      : "Select period";

  const walrusFeeValue = estimatedCost
    ? estimatedCost.subsidizedStorageCost + estimatedCost.subsidizedUploadCost
    : null;
  const walrusStorageFees =
    walrusFeeValue !== null
      ? `${walrusFeeValue.toFixed(6)} WAL`
      : "Calculate first";

  const totalDue = estimatedCost
    ? `${estimatedCost.subsidizedTotalCost.toFixed(6)} WAL`
    : "Calculate first";

  return (
    <div className="flex flex-col gap-8 items-center">
      <img
        src="/assets/images/modal-icons/modal-review.png"
        alt="Walrus Logo"
        className="w-30 h-30"
      />
      <div className="flex flex-col gap-2 text-center">
        <h2 className="text-lg font-semibold">Review transaction</h2>
        <p className="text-sm text-muted-foreground">
          Please review details to confirm your transaction to complete publish
          campaign.
        </p>
      </div>

      <Card className="border-black-50 w-full bg-white-200">
        <CardContent className="p-4 flex flex-col gap-4 ">
          <CardContent className="flex flex-col gap-4 p-0">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-sm text-black-400">
                <span className="font-normal">Walrus storage fees</span>
                <span className="font-medium">{walrusStorageFees}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-black-400">
                <span className="font-normal">Registration expires</span>
                <span className="font-medium">{registrationExpires}</span>
              </div>
            </div>
            <div className="h-px bg-black-50" />
            <div className="flex items-center justify-between pt-1 rounded-lg">
              <span className="text-sm font-semibold text-black-500">
                Total Due
              </span>
              <span className="text-sm font-semibold text-black-400">
                {totalDue}
              </span>
            </div>
          </CardContent>
        </CardContent>
      </Card>

      <div className="flex gap-4 w-full">
        <Button
          onClick={onCancel}
          className="w-full bg-black-50 text-black-500 hover:bg-white-600 border-none"
        >
          Cancel
        </Button>
        <Button onClick={onConfirm} className="w-full">
          Proceed & Sign
        </Button>
      </div>
    </div>
  );
};
