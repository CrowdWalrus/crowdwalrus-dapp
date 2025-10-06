import styles from "./UploadingState.module.css";

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
 * Design considerations:
 * - Progress should be clearly visible
 * - Motion should feel alive but calm to communicate background processing
 */
export interface UploadingStateProps {
  /** Upload progress percentage (0-100) */
  progress: number;

  /** Message to display during upload */
  message?: string;
}

export const UploadingState = ({
  progress,
  message = "Uploading campaign data to Walrus...",
}: UploadingStateProps) => {
  return (
    <div className="py-6">
      <div className="flex flex-col gap-6 items-center justify-center w-full">
        <img
          src="/assets/images/modal-icons/modal-upload.png"
          alt="Upload"
          className={`w-30 h-30 ${styles.uploadIllustration}`}
        />

        <div className="space-y-2 w-full">
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="text-center flex flex-col gap-2 pt-6">
        <h2 className="text-lg font-semibold">{message}</h2>
        <p className="text-sm text-muted-foreground">
          Please wait while your files are being uploaded.
        </p>
      </div>
    </div>
  );
};
