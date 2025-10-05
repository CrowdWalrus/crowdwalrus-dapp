/**
 * Main Campaign Creation Modal Container
 *
 * This component orchestrates the entire campaign creation modal flow.
 * It renders different state components based on the current wizard step
 * and handles the coordination between UI states and business logic.
 *
 * Architecture:
 * - Single modal container (no opening/closing between steps)
 * - Content changes based on wizardStep
 * - Smooth transitions between states
 * - All handlers passed from parent (NewCampaignPage)
 *
 * Usage in NewCampaignPage:
 * <CampaignCreationModal
 *   isOpen={modal.isOpen}
 *   currentStep={modal.currentStep}
 *   onClose={modal.closeModal}
 *   onConfirmRegister={handleConfirmRegister}
 *   onConfirmTransaction={handleConfirmTransaction}
 *   onRetry={handleRetry}
 *   estimatedCost={estimatedCost}
 *   uploadProgress={uploadProgress}
 *   campaignResult={campaignResult}
 *   errorTitle={errorHeading}
 *   error={error}
 * />
 */

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  // DialogHeader,
  // DialogTitle,
  // DialogDescription,
} from "@/shared/components/ui/dialog";
import { WizardStep } from "@/features/campaigns/types/campaign";
import type {
  StorageCostEstimate,
  CreateCampaignResult,
} from "@/features/campaigns/types/campaign";

// Import state components
import { ReviewWalrusTransaction } from "./states/ReviewWalrusTransaction";
import { ProcessingState } from "./states/ProcessingState";
import { UploadingState } from "./states/UploadingState";
import { TransactionConfirmState } from "./states/TransactionConfirmState";
import { SuccessState } from "./states/SuccessState";
import { ErrorState } from "./states/ErrorState";

const FAKE_UPLOAD_DURATION_MS = 30_000;

export interface CampaignCreationModalProps {
  /** Whether the modal is open */
  isOpen: boolean;

  /** Current wizard step determining which content to show */
  currentStep: WizardStep | null;

  /** Handler to close the modal */
  onClose: () => void;

  // === Confirmation Handlers ===
  /** Called when user confirms storage registration (pays WAL) */
  onConfirmRegister?: () => void;

  /** Called when user cancels storage registration */
  onCancelRegister?: () => void;

  /** Called when user confirms campaign creation transaction */
  onConfirmTransaction?: () => void;

  /** Called when user cancels campaign creation transaction */
  onCancelTransaction?: () => void;

  /** Called when user clicks retry after an error */
  onRetry?: () => void;

  // === Data Props ===
  /** Storage cost estimation for the confirm register step */
  estimatedCost?: StorageCostEstimate | null;

  /** Upload progress percentage (0-100) for uploading state */
  uploadProgress?: number;

  /** Campaign creation result for success state */
  campaignResult?: CreateCampaignResult | null;

  /** Error message for error state */
  error?: string | null;

  /** Optional custom title for error state */
  errorTitle?: string | null;

  /** Current processing message (optional override) */
  processingMessage?: string;
}

export const CampaignCreationModal = ({
  isOpen,
  currentStep,
  onClose,
  onConfirmRegister,
  onCancelRegister,
  onConfirmTransaction,
  onCancelTransaction,
  onRetry,
  estimatedCost,
  uploadProgress = 0,
  campaignResult,
  error,
  errorTitle,
  processingMessage,
}: CampaignCreationModalProps) => {
  const [fakeUploadProgress, setFakeUploadProgress] = useState(0);

  useEffect(() => {
    if (currentStep !== WizardStep.UPLOADING) {
      setFakeUploadProgress(0);
      return;
    }

    setFakeUploadProgress(0);
    const now = () =>
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const startTime = now();
    let intervalId = 0;

    const tick = () => {
      const elapsed = now() - startTime;
      const nextValue = Math.min(
        100,
        (elapsed / FAKE_UPLOAD_DURATION_MS) * 100,
      );

      setFakeUploadProgress((prev) => (nextValue > prev ? nextValue : prev));

      if (elapsed >= FAKE_UPLOAD_DURATION_MS) {
        window.clearInterval(intervalId);
      }
    };

    intervalId = window.setInterval(tick, 100);
    tick();

    return () => {
      window.clearInterval(intervalId);
    };
  }, [currentStep]);

  const derivedUploadProgress =
    currentStep === WizardStep.UPLOADING
      ? Math.min(100, Math.max(uploadProgress ?? 0, fakeUploadProgress))
      : 0;

  /**
   * Render the appropriate state component based on currentStep
   * Each state component is responsible for its own UI
   */
  const renderContent = () => {
    switch (currentStep) {
      // === Storage Registration Flow ===
      case WizardStep.CONFIRM_REGISTER:
        return (
          <ReviewWalrusTransaction
            estimatedCost={estimatedCost}
            onConfirm={onConfirmRegister}
            onCancel={onCancelRegister}
          />
        );

      case WizardStep.REGISTERING:
        return (
          <ProcessingState
            message={
              processingMessage || "Signing storage registration transaction..."
            }
            description="Please confirm the transaction in your wallet"
          />
        );

      // === Upload Flow ===
      case WizardStep.UPLOADING:
        return (
          <UploadingState
            progress={derivedUploadProgress}
            message="Off-chain Upload"
          />
        );

      // === Certification Flow ===
      case WizardStep.CERTIFYING:
        return (
          <ProcessingState
            message={processingMessage || "Certifying blob storage..."}
            description="Please confirm the transaction in your wallet"
          />
        );

      // === Campaign Creation Flow ===
      case WizardStep.CONFIRM_TX:
        return (
          <TransactionConfirmState
            onConfirm={onConfirmTransaction}
            onCancel={onCancelTransaction}
          />
        );

      case WizardStep.EXECUTING:
        return (
          <ProcessingState
            message={processingMessage || "Creating your campaign..."}
            description="Please confirm the transaction in your wallet"
          />
        );

      // === Result States ===
      case WizardStep.SUCCESS:
        return (
          <SuccessState campaignResult={campaignResult} onClose={onClose} />
        );

      case WizardStep.ERROR:
        return (
          <ErrorState
            title={errorTitle ?? undefined}
            error={error}
            onRetry={onRetry}
            onClose={onClose}
          />
        );

      // === Default ===
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"

        // TODO: Add custom styling here
        // You can adjust max width, padding, etc. based on your design
      >
        {/*
          TODO: Optionally add a common header here that appears for all states
          Or let each state component handle its own header
        */}

        {/* Render state-specific content */}
        {renderContent()}

        {/*
          TODO: Optionally add a common footer here
          Or let each state component handle its own footer
        */}
      </DialogContent>
    </Dialog>
  );
};
