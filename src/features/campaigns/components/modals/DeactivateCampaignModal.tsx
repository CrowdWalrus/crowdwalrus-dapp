import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

interface DeactivateCampaignModalProps {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeactivateCampaignModal({
  open,
  onConfirm,
  onClose,
}: DeactivateCampaignModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(state) => (!state ? onClose() : undefined)}
    >
      <DialogContent className="max-w-lg px-10 py-12 rounded-2xl bg-white-50 flex flex-col gap-10 [&>button]:hidden">
        {/* Content Section: Icon + Text (gap-6 = 24px) */}
        <div className="flex flex-col items-center gap-6 text-center w-full">
          {/* Modal Icon */}
          <div className="size-[120px] shrink-0">
            <img
              src="/assets/images/modal-icons/modal-deactivate.png"
              alt=""
              className="size-full object-cover"
            />
          </div>

          {/* Title and Description Container (gap-2 = 8px) */}
          <div className="flex flex-col gap-2 w-full">
            <DialogTitle className="text-2xl font-semibold text-black-500 leading-[1.6] text-center">
              Deactivate Campaign
            </DialogTitle>
            <DialogDescription className="text-base font-normal text-black-300 leading-[1.6] text-center">
              Are you certain you wish to deactivate this campaign?
              <br />
              <br />
              Please note that you will not be able to receive contributions
              from donors until it is reactivated.
            </DialogDescription>
          </div>
        </div>

        {/* Button Footer (gap-4 = 16px between buttons) */}
        <div className="flex gap-4 justify-center w-full">
          <Button
            variant="ghost"
            onClick={onClose}
            type="button"
            className="flex-1 h-10 px-6 py-2.5 bg-black-50 border border-black-50 text-black-500 text-sm font-medium tracking-[0.07px] rounded-lg hover:bg-white-300"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            className="flex-1 h-10 px-6 py-2.5 bg-orange-600 text-white-50 text-sm font-medium tracking-[0.07px] rounded-lg hover:bg-orange-500"
          >
            Yes, Deactivate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
