import { useMemo, useState } from "react";
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

  /** Controls copy for campaign creation vs update vs profile flow */
  mode?: "campaign" | "campaign-update" | "profile";

  /** Explicit subdomain to use when computing the redirect path */
  subdomainName?: string | null;
}

export const SuccessState = ({
  campaignResult,
  onClose,
  updateResult,
  mode = "campaign",
  subdomainName,
}: SuccessStateProps) => {
  const [copied, setCopied] = useState(false);
  const campaignDomain = useNetworkVariable("campaignDomain") as
    | string
    | undefined;

  const isUpdate = mode === "campaign-update";
  const isProfile = mode === "profile";
  const effectiveCampaignId = isUpdate
    ? updateResult?.campaignId
    : campaignResult?.campaignId;

  const derivedSubdomain = campaignResult?.subdomain ?? subdomainName ?? null;

  // Generate full campaign SuiNS address (subdomain + campaignDomain)
  const fullCampaignSuiAddress =
    campaignResult?.subdomain && campaignDomain
      ? `${campaignResult.subdomain}.${campaignDomain}`
      : "";

  const campaignDetailPath = effectiveCampaignId
    ? buildCampaignDetailPath(effectiveCampaignId, {
        subdomainName: derivedSubdomain ?? undefined,
        campaignDomain,
      })
    : "/";

  const campaignDetailPathWithUpdatesTab = `${campaignDetailPath}${
    campaignDetailPath.includes("?") ? "&" : "?"
  }tab=updates`;

  const viewCampaignUrl = isUpdate
    ? campaignDetailPathWithUpdatesTab
    : campaignDetailPath;

  const shareableCampaignUrl = useMemo(() => {
    if (
      !effectiveCampaignId ||
      !campaignDetailPath ||
      campaignDetailPath === "/"
    ) {
      return "";
    }

    if (
      campaignDetailPath.startsWith("http://") ||
      campaignDetailPath.startsWith("https://")
    ) {
      return campaignDetailPath;
    }

    if (typeof window === "undefined") {
      return campaignDetailPath;
    }

    const origin = window.location.origin ?? "";
    if (!origin) {
      return campaignDetailPath;
    }

    try {
      return new URL(campaignDetailPath, origin).toString();
    } catch {
      return `${origin.replace(/\/$/, "")}${campaignDetailPath}`;
    }
  }, [campaignDetailPath, effectiveCampaignId]);

  const copyTarget = shareableCampaignUrl || fullCampaignSuiAddress;

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!copyTarget) return;

    try {
      await navigator.clipboard.writeText(copyTarget);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleViewCampaign = () => {
    onClose?.();
    window.location.href = viewCampaignUrl;
  };

  const shouldShowCopySection = !!copyTarget && campaignDetailPath !== "/";

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
          {isProfile
            ? "Profile Updated 🎉"
            : isUpdate
              ? "Update Published 🎉"
              : "Congratulations 🥳"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isProfile
            ? "Your profile image is now ready to use everywhere on Crowd Walrus."
            : isUpdate
              ? "Your campaign update is live and visible to your supporters."
              : "Your campaign has been published successfully."}
        </p>
      </div>

      {/* Campaign link with Copy button */}
      {shouldShowCopySection && (
        <div className="flex justify-center pb-10">
          <div className="mx-auto flex w-full max-w-[400px] items-center overflow-hidden  rounded-lg border border-border bg-background">
            <div className="flex min-h-[40px] min-w-0 grow items-center gap-3 px-4 py-2.5">
              <p
                className="font-normal text-sm text-foreground whitespace-nowrap overflow-hidden text-ellipsis"
                title={shareableCampaignUrl || fullCampaignSuiAddress}
              >
                {shareableCampaignUrl || fullCampaignSuiAddress}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="flex shrink-0 items-center gap-2 border-l border-border bg-background px-3 py-2.5 transition-colors hover:bg-accent"
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
        {!isProfile && (
          <Button onClick={handleViewCampaign} className="w-full">
            {isUpdate ? "View Updates" : "View Campaign"}
          </Button>
        )}
        {isProfile && (
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        )}
      </div>
    </div>
  );
};
