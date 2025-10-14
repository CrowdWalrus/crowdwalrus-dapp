import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/ui/dialog";

interface ActivateCampaignModalProps {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ActivateCampaignModal({
  open,
  onConfirm,
  onClose,
}: ActivateCampaignModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(state) => (!state ? onClose() : undefined)}
    >
      <DialogContent className="max-w-lg px-10 py-12 rounded-2xl bg-white-50 flex flex-col gap-10 [&>button]:hidden">
        <div className="flex flex-col items-center gap-6 text-center w-full">
          <div className="size-[120px] shrink-0">
            <img
              src="/assets/images/modal-icons/modal-success.png"
              alt=""
              className="size-full object-cover"
            />
          </div>

          <div className="flex flex-col gap-2 w-full">
            <DialogTitle className="text-2xl font-semibold text-black-500 leading-[1.6] text-center">
              Activate Campaign
            </DialogTitle>
            <DialogDescription className="text-base font-normal text-black-300 leading-[1.6] text-center">
              Ready to bring this campaign back online?
              <br />
              <br />
              Once activated, supporters will be able to contribute again.
            </DialogDescription>
          </div>
        </div>

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
            className="flex-1 h-10 px-6 py-2.5 bg-sgreen-700 text-white-50 text-sm font-medium tracking-[0.07px] rounded-lg hover:bg-sgreen-600"
          >
            Yes, Activate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
