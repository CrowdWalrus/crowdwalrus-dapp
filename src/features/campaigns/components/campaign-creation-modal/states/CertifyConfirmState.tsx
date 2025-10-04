/**
 * Certify Confirm State Component
 *
 * Shown when: WizardStep.CONFIRM_CERTIFY
 *
 * Purpose:
 * - Get user confirmation for blob certification transaction
 * - Explain what certification means in Walrus
 * - Allow user to proceed or cancel
 *
 * UI Elements to implement:
 * - Title: "Certify Storage"
 * - Explanation of certification step
 * - Information about what was uploaded
 * - "Proceed" button (calls onConfirm)
 * - "Cancel" button (calls onCancel)
 *
 * Design considerations:
 * - Clear explanation of why certification is needed
 * - Reassure that upload was successful
 * - Simple confirmation flow
 */

export interface CertifyConfirmStateProps {
  /** Called when user clicks "Proceed" */
  onConfirm?: () => void

  /** Called when user clicks "Cancel" */
  onCancel?: () => void
}

export const CertifyConfirmState = ({
  onConfirm,
  onCancel,
}: CertifyConfirmStateProps) => {
  // TODO: Implement your UI here

  return (
    <div className="space-y-4">
      {/* TODO: Add your modal header */}
      <div>
        <h2 className="text-lg font-semibold">Certify Storage</h2>
        <p className="text-sm text-muted-foreground">
          Confirm certification of your uploaded data
        </p>
      </div>

      {/* TODO: Success indicator for upload */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <p className="text-sm text-green-800">
          ✓ Upload successful
        </p>
        {/* TODO: Add more details about what was uploaded */}
      </div>

      {/* TODO: Explain certification */}
      <div className="space-y-2">
        <p className="text-sm">
          The next step is to certify your stored data on the Walrus network.
        </p>
        <p className="text-sm text-muted-foreground">
          {/* TODO: Add more detailed explanation of certification */}
          This ensures your data is permanently available and verifiable.
        </p>
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
