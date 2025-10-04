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
import { Button } from "@/shared/components/ui/button";

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
  // TODO: Implement your UI here

  return (
    <div className="flex flex-col items-center justify-center">
      <img
        src="/assets/images/modal-icons/modal-review.png"
        alt="Walrus Logo"
        className="w-30 h-30"
      />
      <div className="text-center py-6 gap-2">
        <h2 className="text-lg font-semibold">Review transaction</h2>
        <p className="text-sm text-muted-foreground">
          Please review details to confirm your transaction to complete publish
          campaign.
        </p>
      </div>

      {/* TODO: Display cost estimation */}
      {estimatedCost && (
        <div className="space-y-2">
          <div className="rounded-lg border p-4">
            <p className="text-sm">Estimated Cost</p>
            <p className="text-2xl font-bold">
              {estimatedCost.subsidizedTotalCost.toFixed(6)} WAL
            </p>
            {/* TODO: Add more cost breakdown details here */}
            {/* - Raw size vs encoded size */}
            {/* - Storage epochs */}
            {/* - Subsidy information */}
          </div>
        </div>
      )}

      {/* TODO: Add explanation of what's happening */}
      <div className="text-sm text-muted-foreground">
        {/* Explain storage registration, WAL payment, etc. */}
      </div>

      {/* TODO: Action buttons */}
      <div className="flex gap-4 justify-end w-full">
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
