import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/ui/dialog";

interface WalrusReuploadWarningModalProps {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function WalrusReuploadWarningModal({
  open,
  onConfirm,
  onClose,
}: WalrusReuploadWarningModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(state) => (!state ? onClose() : undefined)}
    >
      <DialogContent className="max-w-md px-10 py-12 rounded-3xl bg-white-50 flex flex-col items-center gap-8 text-center [&>button]:hidden">
        <div className="size-[120px] shrink-0">
          <img
            src="/assets/images/modal-icons/modal-error.png"
            alt="Walrus storage warning"
            className="size-full object-contain"
          />
        </div>

        <div className="flex flex-col gap-4">
          <DialogTitle className="text-2xl font-semibold leading-[1.6] text-black-500">
            oops!
          </DialogTitle>
          <DialogDescription className="flex flex-col gap-1 text-base font-normal leading-[1.6] text-black-300">
            <p>All CrowdWalrus media is stored on Walrus.</p>
            <p>
              Changing this field requires purchasing a new storage
              subscription.
            </p>
            <p>Are you sure you want to proceed?</p>
          </DialogDescription>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Button
            variant="ghost"
            onClick={onClose}
            type="button"
            className="flex-1 h-10 px-6 py-2.5 rounded-lg bg-black-50 text-black-500 font-medium hover:bg-white-300"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            className="flex-1 h-10 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90"
          >
            Proceed
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
