import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/ui/dialog";

export type CampaignVerificationAction = "verify" | "unverify";

interface CampaignVerificationModalProps {
  open: boolean;
  action: CampaignVerificationAction;
  campaignName: string;
  onConfirm: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

export function CampaignVerificationModal({
  open,
  action,
  campaignName,
  onConfirm,
  onClose,
  isSubmitting = false,
}: CampaignVerificationModalProps) {
  const isVerify = action === "verify";
  const title = isVerify ? "Verify campaign" : "Unverify campaign";
  const description = isVerify
    ? "This will add the verified badge and include the campaign in verified listings."
    : "This will remove the verified badge and remove the campaign from verified listings.";
  const confirmLabel = isVerify ? "Yes, Verify" : "Yes, Unverify";
  const submittingLabel = isVerify ? "Verifying..." : "Unverifying...";
  const iconSrc = isVerify
    ? "/assets/images/modal-icons/modal-verify.png"
    : "/assets/images/modal-icons/modal-remove-verification.png";

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => (!state ? onClose() : undefined)}
    >
      <DialogContent className="max-w-lg px-10 py-12 rounded-2xl bg-white-50 flex flex-col gap-10 [&>button]:hidden">
        <div className="flex flex-col items-center gap-6 text-center w-full">
          <div className="size-[120px] shrink-0">
            <img src={iconSrc} alt="" className="size-full object-cover" />
          </div>

          <div className="flex flex-col gap-2 w-full">
            <DialogTitle className="text-2xl font-semibold text-black-500 leading-[1.6] text-center">
              {title}
            </DialogTitle>
            <DialogDescription className="text-base font-normal text-black-300 leading-[1.6] text-center">
              You are about to {isVerify ? "verify" : "unverify"} "{campaignName}".
              <br />
              {description}
            </DialogDescription>
          </div>
        </div>

        <div className="flex gap-4 justify-center w-full">
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
            className={
              isVerify
                ? "flex-1 h-10 px-6 py-2.5 bg-sgreen-700 text-white-50 text-sm font-medium tracking-[0.07px] rounded-lg hover:bg-sgreen-600"
                : "flex-1 h-10 px-6 py-2.5 bg-destructive text-destructive-foreground text-sm font-medium tracking-[0.07px] rounded-lg hover:bg-destructive/90"
            }
          >
            {isSubmitting ? submittingLabel : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
