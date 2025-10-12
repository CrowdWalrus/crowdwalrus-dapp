import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
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
    <Dialog open={open} onOpenChange={(state) => (!state ? onClose() : undefined)}>
      <DialogContent className="max-w-md space-y-6">
        <DialogHeader className="space-y-3 text-left">
          <DialogTitle className="text-2xl font-semibold text-[#111827]">
            oops!
          </DialogTitle>
          <DialogDescription className="space-y-2 text-base leading-relaxed text-[#1f2937]">
            <p>All CrowdWalrus media is stored on Walrus.</p>
            <p>
              Changing this field requires purchasing a new storage
              subscription.
            </p>
            <p>Are you sure you want to proceed?</p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirm();
            }}
          >
            Proceed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
