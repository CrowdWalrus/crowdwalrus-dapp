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

import { Button } from "@/shared/components/ui/button";

export interface ErrorStateProps {
  /** Optional title to display above the error description */
  title?: string;

  /** Error message to display */
  error?: string | null;

  /** Called when user clicks "Try Again" */
  onRetry?: () => void;

  /** Called when user clicks "Cancel" or "Close" */
  onClose?: () => void;
}

export const ErrorState = ({
  title = "Something went wrong",
  error = "An error occurred",
  onRetry,
  onClose,
}: ErrorStateProps) => {
  // TODO: Implement your UI here

  return (
    <div className="flex flex-col items-center justify-center gap-10 py-6">
      {/* TODO: Error icon */}
      <img
        src="/assets/images/modal-icons/modal-error.png"
        alt="Error"
        className="w-30 h-30"
      />

      {/* TODO: Error message */}
      <div className="flex flex-col text-center gap-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        {error ? (
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {error}
          </p>
        ) : null}
      </div>

      {/* TODO: Common error scenarios help */}
      {/* You could add specific help for common errors like: */}
      {/* - Wallet connection issues */}
      {/* - Insufficient funds */}
      {/* - Network errors */}
      {/* - Upload failures */}

      {/* TODO: Action buttons */}
      <div className="flex gap-4 justify-end w-full">
        <Button
          onClick={onClose}
          className="w-full bg-black-50 text-black-500 hover:bg-white-600 border-none"
        >
          Cancel
        </Button>
        {onRetry && (
          <Button
            onClick={onRetry}
            className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground"
          >
            Try Again
          </Button>
        )}
      </div>

      {/* TODO: Optional support link */}
      {/* <div className="text-center text-sm">
        <a href="#" className="text-primary hover:underline">
          Need help? Contact support
        </a>
      </div> */}
    </div>
  );
};
