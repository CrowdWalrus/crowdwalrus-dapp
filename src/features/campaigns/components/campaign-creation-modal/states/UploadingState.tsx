/**
 * Uploading State Component
 *
 * Shown when: WizardStep.UPLOADING
 *
 * Purpose:
 * - Show progress of data upload to Walrus storage nodes
 * - Display percentage or progress bar
 * - Reassure user that upload is happening
 *
 * UI Elements to implement:
 * - Progress bar (0-100%)
 * - Progress percentage display
 * - Upload status message
 * - Optional: Upload speed, time remaining, file info
 *
 * Design considerations:
 * - Progress should be clearly visible
 * - Smooth progress bar animation
 * - Clear indication of what's being uploaded
 * - No cancel button (upload must complete)
 */

export interface UploadingStateProps {
  /** Upload progress percentage (0-100) */
  progress: number

  /** Message to display during upload */
  message?: string
}

export const UploadingState = ({
  progress,
  message = 'Uploading campaign data to Walrus...',
}: UploadingStateProps) => {
  // TODO: Implement your UI here

  return (
    <div className="space-y-6 py-8">
      {/* TODO: Add upload icon or animation */}
      <div className="flex justify-center">
        {/* You can add an upload icon, animation, or illustration here */}
        <div className="text-4xl">📤</div>
        {/* Replace with proper icon component */}
      </div>

      {/* TODO: Display upload message */}
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold">{message}</h2>
        <p className="text-sm text-muted-foreground">
          Please wait while your campaign data is being stored
        </p>
      </div>

      {/* TODO: Progress bar */}
      <div className="space-y-2">
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-center text-sm text-muted-foreground">
          {progress.toFixed(0)}% complete
        </div>
      </div>

      {/* TODO: Optional additional upload details */}
      {/* - File names being uploaded */}
      {/* - Upload speed */}
      {/* - Time remaining estimate */}
    </div>
  )
}
