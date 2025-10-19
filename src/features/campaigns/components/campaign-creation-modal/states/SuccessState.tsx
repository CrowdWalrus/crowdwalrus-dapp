import { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { CreateCampaignResult } from "@/features/campaigns/types/campaign";
import type { CampaignUpdateResult } from "@/features/campaigns/types/campaignUpdate";
import { Button } from "@/shared/components/ui/button";
import { useNetworkVariable } from "@/shared/config/networkConfig";
import { buildCampaignDetailPath } from "@/shared/utils/routes";

export interface SuccessStateProps {
  /** Campaign creation result data */
  campaignResult?: CreateCampaignResult | null;

  /** Called when user clicks "Close" */
  onClose?: () => void;

  /** Campaign update result data */
  updateResult?: CampaignUpdateResult | null;

  /** Controls copy for campaign creation vs update flow */
  mode?: "campaign" | "campaign-update";
}

export const SuccessState = ({
  campaignResult,
  onClose,
  updateResult,
  mode = "campaign",
}: SuccessStateProps) => {
  const [copied, setCopied] = useState(false);
  const campaignDomain = useNetworkVariable("campaignDomain") as
    | string
    | undefined;

  const isUpdate = mode === "campaign-update";
  const effectiveCampaignId = isUpdate
    ? updateResult?.campaignId
    : campaignResult?.campaignId;

  // Generate full campaign SuiNS address (subdomain + campaignDomain)
  const fullCampaignSuiAddress =
    campaignResult?.subdomain && campaignDomain
      ? `${campaignResult.subdomain}.${campaignDomain}`
      : "";

  const campaignDetailPath = effectiveCampaignId
    ? buildCampaignDetailPath(effectiveCampaignId, {
        subdomainName: campaignResult?.subdomain,
        campaignDomain,
      })
    : "/";

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!fullCampaignSuiAddress) return;

    try {
      await navigator.clipboard.writeText(fullCampaignSuiAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleViewCampaign = () => {
    onClose?.();
    window.location.href = campaignDetailPath;
  };

  return (
    <div className="py-3">
      {/* Success icon */}
      <div className="flex justify-center pb-6">
        <img
          src="/assets/images/modal-icons/modal-success.png"
          alt="Success"
          className="w-30 h-30"
        />
      </div>

      {/* Success message */}
      <div className="flex flex-col gap-2 text-center pb-6">
        <h2 className="text-2xl font-bold">
          {isUpdate ? "Update Published 🎉" : "Congratulations 🥳"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isUpdate
            ? "Your campaign update is live and visible to your supporters."
            : "Your campaign has been published successfully."}
        </p>
      </div>

      {/* Campaign SuiNS Address with Copy button */}
      {campaignResult && fullCampaignSuiAddress && (
        <div className="pb-10">
          <div className="flex items-center">
            <div className="basis-0 bg-background border border-border border-r-0 grow min-h-[40px] rounded-bl-lg rounded-tl-lg">
              <div className="flex items-center gap-3 px-4 py-2.5">
                <p className="font-normal text-sm text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                  {fullCampaignSuiAddress}
                </p>
              </div>
            </div>
            <button
              onClick={handleCopy}
              className="bg-background border border-border h-[40px] rounded-br-lg rounded-tr-lg px-3 hover:bg-accent transition-colors flex items-center gap-2"
            >
              {copied ? (
                <Check className="size-5 text-foreground" />
              ) : (
                <Copy className="size-5 text-foreground" />
              )}
              <span className="font-semibold text-sm text-foreground">
                {copied ? "Copied" : "Copy"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div>
        <Button onClick={handleViewCampaign} className="w-full">
          {isUpdate ? "View Campaign" : "View Campaign"}
        </Button>
      </div>
    </div>
  );
};
