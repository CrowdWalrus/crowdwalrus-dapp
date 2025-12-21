import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/ui/dialog";

const APPLY_FOR_VERIFICATION_URL = "https://form.typeform.com/to/HaM6QLE7";
const VERIFICATION_DOCS_URL =
  "https://github.com/CrowdWalrus/Docs/blob/main/VerificationProcess.md";

interface UnverifiedCampaignModalProps {
  open: boolean;
  onClose: () => void;
}

export function UnverifiedCampaignModal({
  open,
  onClose,
}: UnverifiedCampaignModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(state) => (!state ? onClose() : undefined)}
    >
      <DialogContent className="max-w-lg px-10 py-12 rounded-2xl bg-white-50 flex flex-col gap-8">
        <div className="flex flex-col items-center gap-6 text-center w-full">
          <div className="size-[120px] shrink-0">
            <img
              src="/assets/images/modal-icons/modal-review.png"
              alt=""
              className="size-full object-cover"
            />
          </div>

          <div className="flex flex-col gap-2 w-full">
            <DialogTitle className="text-2xl font-semibold text-black-500 leading-[1.6] text-center">
              Unverified Campaign
            </DialogTitle>
            <DialogDescription className="text-base font-normal text-black-300 leading-[1.6] text-center">
              Only verified campaigns are eligible to be listed on the Home page
              and Explore page of CrowdWalrus.
            </DialogDescription>
          </div>
        </div>

        <div className="flex flex-col gap-4 text-black-400">
          <p className="text-base font-normal leading-[1.6]">
            You can still fully use your campaign:
          </p>
          <ul className="list-disc pl-5 text-base font-normal leading-[1.6]">
            <li>Raise funds on-chain</li>
            <li>Share your campaign URL</li>
            <li>Post updates and engage supporters</li>
          </ul>
          <p className="text-base font-normal leading-[1.6]">
            The Unverified badge is visible to all users and indicates that this
            campaign has not yet completed the CrowdWalrus verification process.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            asChild
            className="w-full h-10 px-6 py-2.5 bg-sgreen-700 text-white-50 text-sm font-medium tracking-[0.07px] rounded-lg hover:bg-sgreen-600"
          >
            <a
              href={APPLY_FOR_VERIFICATION_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Apply for Verification
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full h-10 px-6 py-2.5 text-sm font-medium tracking-[0.07px] rounded-lg"
          >
            <a
              href={VERIFICATION_DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn about verification
            </a>
          </Button>
          <p className="text-xs text-black-200 leading-[1.6] text-center">
            Verification helps increase trust, visibility, and discoverability
            within the CrowdWalrus ecosystem.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

