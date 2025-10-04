/**
 * Register Confirm State Component
 *
 * Shown when: WizardStep.CONFIRM_REGISTER
 *
 * Purpose:
 * - Display storage cost estimation
 * - Show what the user is paying for (WAL tokens for Walrus storage)
 * - Get user confirmation before proceeding with the transaction
 *
 * UI Elements to implement:
 * - Title: "Register Walrus Storage"
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

import type { StorageCostEstimate } from '@/features/campaigns/types/campaign'

export interface RegisterConfirmStateProps {
  /** Storage cost estimation data */
  estimatedCost?: StorageCostEstimate | null

  /** Called when user clicks "Proceed" */
  onConfirm?: () => void

  /** Called when user clicks "Cancel" */
  onCancel?: () => void
}

export const RegisterConfirmState = ({
  estimatedCost,
  onConfirm,
  onCancel,
}: RegisterConfirmStateProps) => {
  // TODO: Implement your UI here

  return (
    <div className="space-y-4">
      {/* TODO: Add your modal header */}
      <div>
        <h2 className="text-lg font-semibold">Register Walrus Storage</h2>
        <p className="text-sm text-muted-foreground">
          Confirm storage registration for your campaign data
        </p>
      </div>

      {/* TODO: Display cost estimation */}
      {estimatedCost && (
        <div className="space-y-2">
          <div className="rounded-lg border p-4">
            <p className="text-sm">Estimated Cost</p>
            <p className="text-2xl font-bold">
              {estimatedCost.subsidizedTotalCost.toFixed(4)} WAL
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
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-md border"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
        >
          Proceed
        </button>
      </div>
    </div>
  )
}
