/**
 * Error State Component
 *
 * Shown when: WizardStep.ERROR
 *
 * Purpose:
 * - Display error message when something goes wrong
 * - Provide context about what failed
 * - Give user options to retry or cancel
 * - Show helpful troubleshooting info
 *
 * UI Elements to implement:
 * - Error icon
 * - Error title
 * - Error message/description
 * - "Try Again" button (calls onRetry)
 * - "Cancel" button (calls onClose)
 * - Optional: Link to support/documentation
 *
 * Design considerations:
 * - Clear but not alarming error display
 * - Helpful error messages
 * - Easy retry flow
 * - Different error types might need different messages
 */

export interface ErrorStateProps {
  /** Error message to display */
  error?: string | null

  /** Called when user clicks "Try Again" */
  onRetry?: () => void

  /** Called when user clicks "Cancel" or "Close" */
  onClose?: () => void
}

export const ErrorState = ({
  error = 'An error occurred',
  onRetry,
  onClose,
}: ErrorStateProps) => {
  // TODO: Implement your UI here

  return (
    <div className="space-y-6 py-4">
      {/* TODO: Error icon */}
      <div className="flex justify-center">
        <div className="text-6xl">⚠️</div>
        {/* Replace with proper error icon component */}
      </div>

      {/* TODO: Error message */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-destructive">
          Something Went Wrong
        </h2>
        <p className="text-sm text-muted-foreground">
          {error}
        </p>
      </div>

      {/* TODO: Error details or help section */}
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          {/* TODO: Add helpful troubleshooting tips based on error type */}
          If the problem persists, please check your wallet connection and try again.
        </p>
      </div>

      {/* TODO: Common error scenarios help */}
      {/* You could add specific help for common errors like: */}
      {/* - Wallet connection issues */}
      {/* - Insufficient funds */}
      {/* - Network errors */}
      {/* - Upload failures */}

      {/* TODO: Action buttons */}
      <div className="flex flex-col gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground"
          >
            Try Again
          </button>
        )}
        <button
          onClick={onClose}
          className="w-full px-4 py-2 rounded-md border"
        >
          Cancel
        </button>
      </div>

      {/* TODO: Optional support link */}
      {/* <div className="text-center text-sm">
        <a href="#" className="text-primary hover:underline">
          Need help? Contact support
        </a>
      </div> */}
    </div>
  )
}
