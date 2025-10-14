import { LoadingSpinner } from "@/shared/components/ui/loading-spinner";

/**
 * Processing State Component (Reusable)
 *
 * Shown when:
 * - WizardStep.REGISTERING (signing storage registration transaction)
 * - WizardStep.CERTIFYING (signing certification transaction)
 * - WizardStep.EXECUTING (signing campaign creation transaction)
 *
 * Purpose:
 * - Show loading spinner while transaction is being signed/processed
 * - Display contextual message about what's happening
 * - Provide feedback that the wallet popup is expected
 *
 * UI Elements to implement:
 * - Loading spinner/animation
 * - Main message (from props)
 * - Optional description/subtitle (from props)
 * - Visual indication that user should check their wallet
 *
 * Design considerations:
 * - Make it clear the process is ongoing
 * - Calm and reassuring tone
 * - No action buttons (user is waiting for transaction)
 */

export interface ProcessingStateProps {
  /** Main message to display (e.g., "Signing transaction...") */
  message: string;

  /** Optional additional description/context */
  description?: string;
}

export const ProcessingState = ({
  message,
  description,
}: ProcessingStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-10 pt-10">
      <div className="flex justify-center">
        <LoadingSpinner />
      </div>

      <div className="flex flex-col text-center gap-2">
        <h2 className="text-lg font-semibold">{message}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        {/* You can add a wallet icon and reminder here */}
      </div>
    </div>
  );
};
