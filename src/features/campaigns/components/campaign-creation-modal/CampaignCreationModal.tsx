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
 *   onConfirmCertify={handleConfirmCertify}
 *   onConfirmTransaction={handleConfirmTransaction}
 *   onRetry={handleRetry}
 *   estimatedCost={estimatedCost}
 *   uploadProgress={uploadProgress}
 *   campaignResult={campaignResult}
 *   error={error}
 * />
 */

import {
  Dialog,
  DialogContent,
  // DialogHeader,
  // DialogTitle,
  // DialogDescription,
} from '@/shared/components/ui/dialog'
import { WizardStep } from '@/features/campaigns/types/campaign'
import type { StorageCostEstimate, CreateCampaignResult } from '@/features/campaigns/types/campaign'

// Import state components
import { RegisterConfirmState } from './states/RegisterConfirmState'
import { ProcessingState } from './states/ProcessingState'
import { UploadingState } from './states/UploadingState'
import { CertifyConfirmState } from './states/CertifyConfirmState'
import { TransactionConfirmState } from './states/TransactionConfirmState'
import { SuccessState } from './states/SuccessState'
import { ErrorState } from './states/ErrorState'

export interface CampaignCreationModalProps {
  /** Whether the modal is open */
  isOpen: boolean

  /** Current wizard step determining which content to show */
  currentStep: WizardStep | null

  /** Handler to close the modal */
  onClose: () => void

  // === Confirmation Handlers ===
  /** Called when user confirms storage registration (pays WAL) */
  onConfirmRegister?: () => void

  /** Called when user confirms blob certification */
  onConfirmCertify?: () => void

  /** Called when user confirms campaign creation transaction */
  onConfirmTransaction?: () => void

  /** Called when user clicks retry after an error */
  onRetry?: () => void

  // === Data Props ===
  /** Storage cost estimation for the confirm register step */
  estimatedCost?: StorageCostEstimate | null

  /** Upload progress percentage (0-100) for uploading state */
  uploadProgress?: number

  /** Campaign creation result for success state */
  campaignResult?: CreateCampaignResult | null

  /** Error message for error state */
  error?: string | null

  /** Current processing message (optional override) */
  processingMessage?: string
}

export const CampaignCreationModal = ({
  isOpen,
  currentStep,
  onClose,
  onConfirmRegister,
  onConfirmCertify,
  onConfirmTransaction,
  onRetry,
  estimatedCost,
  uploadProgress = 0,
  campaignResult,
  error,
  processingMessage,
}: CampaignCreationModalProps) => {
  /**
   * Render the appropriate state component based on currentStep
   * Each state component is responsible for its own UI
   */
  const renderContent = () => {
    switch (currentStep) {
      // === Storage Registration Flow ===
      case WizardStep.CONFIRM_REGISTER:
        return (
          <RegisterConfirmState
            estimatedCost={estimatedCost}
            onConfirm={onConfirmRegister}
            onCancel={onClose}
          />
        )

      case WizardStep.REGISTERING:
        return (
          <ProcessingState
            message={processingMessage || 'Signing storage registration transaction...'}
            description="Please confirm the transaction in your wallet"
          />
        )

      // === Upload Flow ===
      case WizardStep.UPLOADING:
        return (
          <UploadingState
            progress={uploadProgress}
            message="Uploading campaign data to Walrus..."
          />
        )

      // === Certification Flow ===
      case WizardStep.CONFIRM_CERTIFY:
        return (
          <CertifyConfirmState
            onConfirm={onConfirmCertify}
            onCancel={onClose}
          />
        )

      case WizardStep.CERTIFYING:
        return (
          <ProcessingState
            message={processingMessage || 'Certifying blob storage...'}
            description="Please confirm the transaction in your wallet"
          />
        )

      // === Campaign Creation Flow ===
      case WizardStep.CONFIRM_TX:
        return (
          <TransactionConfirmState
            onConfirm={onConfirmTransaction}
            onCancel={onClose}
          />
        )

      case WizardStep.EXECUTING:
        return (
          <ProcessingState
            message={processingMessage || 'Creating your campaign...'}
            description="Please confirm the transaction in your wallet"
          />
        )

      // === Result States ===
      case WizardStep.SUCCESS:
        return (
          <SuccessState
            campaignResult={campaignResult}
            onClose={onClose}
          />
        )

      case WizardStep.ERROR:
        return (
          <ErrorState
            error={error}
            onRetry={onRetry}
            onClose={onClose}
          />
        )

      // === Default ===
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md"
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
  )
}
