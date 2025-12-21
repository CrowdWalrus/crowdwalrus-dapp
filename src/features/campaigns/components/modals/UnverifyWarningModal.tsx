import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/ui/dialog";

interface UnverifyWarningModalProps {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

export function UnverifyWarningModal({
  open,
  onConfirm,
  onClose,
  isSubmitting = false,
}: UnverifyWarningModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(state) => (!state ? onClose() : undefined)}
    >
      <DialogContent className="max-w-lg px-10 py-12 rounded-2xl bg-white-50 flex flex-col gap-10 [&>button]:hidden">
        <div className="flex flex-col items-center gap-6 text-center w-full">
          <div className="size-[120px] shrink-0">
            <img
              src="/assets/images/modal-icons/modal-remove-verification.png"
              alt=""
              className="size-full object-cover"
            />
          </div>

          <div className="flex flex-col gap-2 w-full">
            <DialogTitle className="text-2xl font-semibold text-black-500 leading-[1.6] text-center">
              Verification Status Change
            </DialogTitle>
            <DialogDescription className="text-base font-normal text-black-300 leading-[1.6] text-center">
              Publishing these changes will remove the verified status from your
              campaign.
            </DialogDescription>
          </div>
        </div>

        <div className="flex flex-col gap-4 text-black-400">
          <p className="text-base font-normal leading-[1.6]">
            After publishing your edits:
          </p>
          <ul className="list-disc pl-5 text-base font-normal leading-[1.6]">
            <li>Your campaign will be marked as Unverified</li>
            <li>It will no longer appear on the Home or Explore pages</li>
            <li>You can re-apply for verification after publishing</li>
          </ul>
        </div>

        <div className="flex gap-4 w-full">
          <Button
            variant="ghost"
            onClick={onClose}
            type="button"
            disabled={isSubmitting}
            className="flex-1 h-10 px-6 py-2.5 bg-black-50 border border-black-50 text-black-500 text-sm font-medium tracking-[0.07px] rounded-lg hover:bg-white-300"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 h-10 px-6 py-2.5 bg-orange-600 text-white-50 text-sm font-medium tracking-[0.07px] rounded-lg hover:bg-orange-500"
          >
            {isSubmitting ? "Publishing..." : "Publish Anyway"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
