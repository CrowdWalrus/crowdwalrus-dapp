import { Loader2 } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { LoadingSpinner } from "@/shared/components/ui/loading-spinner";

interface DonationProcessingModalProps {
  open: boolean;
  isBuilding: boolean;
  hasAttemptedConfirmation: boolean;
  isWalletRequestPending: boolean;
  canConfirm: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DonationProcessingModal({
  open,
  isBuilding,
  hasAttemptedConfirmation,
  isWalletRequestPending,
  canConfirm,
  onCancel,
  onConfirm,
}: DonationProcessingModalProps) {
  const awaitingWallet = isWalletRequestPending;
  const confirmLabel = awaitingWallet
    ? "Waiting for wallet"
    : hasAttemptedConfirmation
      ? "Try again"
      : "Confirm";
  const confirmDisabled = isBuilding || awaitingWallet || !canConfirm;

  const title = awaitingWallet
    ? "Waiting for wallet approval"
    : "Confirm transaction";
  const description = awaitingWallet
    ? "Approve the transaction in your wallet to continue."
    : "Please confirm transaction from your wallet";

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => (!state ? onCancel() : undefined)}
    >
      <DialogContent className="max-w-md px-10 py-12 rounded-2xl bg-white [&>button]:hidden">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full">
            <LoadingSpinner size="md" className="text-primary" />
          </div>

          <div className="flex flex-col gap-2">
            <DialogTitle className="text-2xl font-semibold text-black-500">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm text-black-300">
              {description}
            </DialogDescription>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 sm:flex-row">
          <Button
            variant="ghost"
            className="flex-1 h-10 px-6 py-2.5 bg-black-50 border border-black-50 text-black-500 text-sm font-medium tracking-[0.07px] rounded-lg hover:bg-white-300"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 h-10 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-200"
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {awaitingWallet ? (
              <span className="flex items-center justify-center gap-2 text-sm font-semibold">
                <Loader2 className="size-4 animate-spin" />
                {confirmLabel}
              </span>
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
