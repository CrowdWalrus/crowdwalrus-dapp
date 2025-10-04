/**
 * Campaign Creation Modal barrel export
 *
 * Main entry point for the campaign creation modal system
 *
 * Usage in NewCampaignPage:
 *
 * import {
 *   CampaignCreationModal,
 *   useCampaignCreationModal
 * } from '@/features/campaigns/components/campaign-creation-modal'
 *
 * const modal = useCampaignCreationModal()
 *
 * // Open modal when wizard step changes
 * useEffect(() => {
 *   if (wizardStep !== WizardStep.FORM) {
 *     modal.openModal(wizardStep)
 *   }
 * }, [wizardStep])
 *
 * // Render modal
 * <CampaignCreationModal
 *   isOpen={modal.isOpen}
 *   currentStep={modal.currentStep}
 *   onClose={modal.closeModal}
 *   {...otherProps}
 * />
 */

// Main modal component
export { CampaignCreationModal } from './CampaignCreationModal'
export type { CampaignCreationModalProps } from './CampaignCreationModal'

// Modal state management hook
export { useCampaignCreationModal } from './useCampaignCreationModal'
export type { CampaignCreationModalState } from './useCampaignCreationModal'

// Individual state components (if you need to use them separately)
export * from './states'
