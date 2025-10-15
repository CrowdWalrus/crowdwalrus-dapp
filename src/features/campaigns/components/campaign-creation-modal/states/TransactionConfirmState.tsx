/**
 * Transaction Confirm State Component
 *
 * Shown when: WizardStep.CONFIRM_TX
 *
 * Purpose:
 * - Final confirmation before creating the campaign on-chain
 * - Show summary of what will be created
 * - Get user approval for campaign creation transaction
 *
 * UI Elements to implement:
 * - Title: "Create Campaign"
 * - Summary of campaign details
 * - Information about the transaction
 * - "Create Campaign" button (calls onConfirm)
 * - "Cancel" button (calls onCancel)
 *
 * Design considerations:
 * - This is the final step, make it feel important
 * - Show campaign summary (name, goal, etc.)
 * - Clear call-to-action
 * - Excitement for campaign launch
 */

export interface TransactionConfirmStateProps {
  /** Called when user clicks "Create Campaign" */
  onConfirm?: () => void

  /** Called when user clicks "Cancel" */
  onCancel?: () => void

  /** Controls copy for campaign vs update flow */
  mode?: "campaign" | "campaign-update"
}

export const TransactionConfirmState = ({
  onConfirm,
  onCancel,
  mode = "campaign",
}: TransactionConfirmStateProps) => {
  // TODO: Implement your UI here

  const isUpdate = mode === "campaign-update";
  const title = isUpdate ? "Post Campaign Update" : "Create Campaign";
  const subtitle = isUpdate
    ? "You're ready to share this update with your supporters."
    : "You're ready to launch your campaign!";
  const bodyCopy = isUpdate
    ? "Your update content is encoded on Walrus storage. Posting will submit a transaction that links this blob to your campaign."
    : "Your campaign is ready to be published on the blockchain.";
  const ctaLabel = isUpdate ? "Post Update" : "Create Campaign";

  return (
    <div className="space-y-4">
      {/* TODO: Add your modal header */}
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {/* TODO: Show campaign preparation status */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-green-600">✓</span>
          <span>Storage registered</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-green-600">✓</span>
          <span>Data uploaded to Walrus</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-green-600">✓</span>
          <span>Storage certified</span>
        </div>
      </div>

      {/* TODO: Campaign summary (optional) */}
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">{bodyCopy}</p>
      </div>

      {/* TODO: Explanation */}
      <div className="text-sm text-muted-foreground">
        {isUpdate
          ? "Clicking \"Post Update\" will submit a transaction that records this update on-chain."
          : "Clicking \"Create Campaign\" will submit a transaction to create your campaign on the Sui blockchain."}
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
          {ctaLabel}
        </button>
      </div>
    </div>
  )
}
