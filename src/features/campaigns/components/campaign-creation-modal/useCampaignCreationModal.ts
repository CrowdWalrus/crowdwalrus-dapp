/**
 * Modal state management hook for campaign creation flow
 *
 * This hook manages the modal's open/close state and tracks which wizard step
 * should be displayed. It provides a clean API for the NewCampaignPage to control
 * the modal based on the campaign creation wizard flow.
 *
 * Usage in NewCampaignPage:
 * const modal = useCampaignCreationModal()
 *
 * // Open modal when wizard step changes
 * useEffect(() => {
 *   if (wizardStep === WizardStep.CONFIRM_REGISTER) {
 *     modal.openModal(wizardStep)
 *   }
 * }, [wizardStep])
 */

import { useCallback, useMemo, useState } from "react";
import { WizardStep } from "@/features/campaigns/types/campaign";

export interface CampaignCreationModalState {
  /** Whether the modal is currently open */
  isOpen: boolean

  /** Current wizard step being displayed in the modal */
  currentStep: WizardStep | null

  /** Open the modal with a specific wizard step */
  openModal: (step: WizardStep) => void

  /** Close the modal and reset state */
  closeModal: () => void

  /** Update the wizard step without closing/reopening modal (for smooth transitions) */
  setStep: (step: WizardStep) => void
}

export const useCampaignCreationModal = (): CampaignCreationModalState => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<WizardStep | null>(null);

  const openModal = useCallback((step: WizardStep) => {
    setCurrentStep(step);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Optional: Add a small delay before resetting step for exit animation
    // setTimeout(() => setCurrentStep(null), 200)
  }, []);

  const setStep = useCallback((step: WizardStep) => {
    setCurrentStep(step);
  }, []);

  return useMemo(
    () => ({
      isOpen,
      currentStep,
      openModal,
      closeModal,
      setStep,
    }),
    [closeModal, currentStep, isOpen, openModal, setStep],
  );
};
