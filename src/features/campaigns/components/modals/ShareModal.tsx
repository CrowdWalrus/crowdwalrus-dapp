import { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import { useNetworkVariable } from "@/shared/config/networkConfig";
import { buildCampaignDetailPath } from "@/shared/utils/routes";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import XSocial from "@/shared/icons/socials/XSocial";
import FacebookSocial from "@/shared/icons/socials/FacebookSocial";
import LinkedInSocial from "@/shared/icons/socials/LinkedInSocial";
import TelegramSocial from "@/shared/icons/socials/TelegramSocial";

interface ShareModalProps {
  open: boolean;
  campaignId: string;
  campaignName?: string;
  subdomainName?: string | null;
  onClose: () => void;
}

export function ShareModal({
  open,
  campaignId,
  campaignName,
  subdomainName,
  onClose,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const campaignDomain = useNetworkVariable("campaignDomain") as
    | string
    | undefined;
  const trimmedCampaignName = campaignName?.trim();

  const campaignDetailPath = useMemo(
    () =>
      buildCampaignDetailPath(campaignId, {
        subdomainName,
        campaignDomain,
      }),
    [campaignId, subdomainName, campaignDomain],
  );

  const shareableUrl = useMemo(() => {
    if (!campaignDetailPath || campaignDetailPath === "/") {
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
  }, [campaignDetailPath]);

  const displayUrl = useMemo(() => {
    if (!shareableUrl) return "";
    // Show the full URL that will be copied
    return shareableUrl;
  }, [shareableUrl]);

  const handleCopy = async () => {
    if (!shareableUrl) return;

    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSocialShare = (
    platform: "twitter" | "facebook" | "linkedin" | "telegram",
  ) => {
    if (!shareableUrl) return;

    const shareText = trimmedCampaignName
      ? `Check out '${trimmedCampaignName}' on CrowdWalrus!`
      : "Check out this campaign on CrowdWalrus!";
    const encodedUrl = encodeURIComponent(shareableUrl);
    const encodedText = encodeURIComponent(shareText);

    /**
     * Social media share URL formats:
     *
     * Twitter/X: Uses intent/tweet endpoint
     * - url: The link to share
     * - text: Pre-filled tweet text (optional)
     * - Note: twitter.com works for both Twitter and X.com
     *
     * Facebook: Uses sharer.php endpoint
     * - u: The URL to share (must be URL-encoded)
     * - Facebook will automatically fetch Open Graph metadata from the URL
     *
     * LinkedIn: Uses share-offsite endpoint
     * - url: The URL to share (must be URL-encoded)
     * - LinkedIn will automatically fetch Open Graph metadata from the URL
     *
     * Telegram: Uses share/url endpoint
     * - url: The link to share
     * - text: Pre-filled message text (optional)
     */
    const urls: Record<typeof platform, string> = {
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    };

    window.open(urls[platform], "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => (!state ? onClose() : undefined)}
    >
      <DialogContent className="max-w-lg px-6 py-10 rounded-2xl bg-white">
        <div className="flex flex-col gap-6 items-center">
          {/* Header */}
          <div className="flex flex-col gap-2 text-center">
            <h2 className="text-2xl font-semibold text-black-500 leading-[1.6]">
              Spread the word
            </h2>
            <p className="text-base text-black-300 leading-[1.6]">
              Share your campaign link or post it directly on your social media
              platforms to inform your connections.
            </p>
          </div>

          {/* URL Input with Copy Button */}
          <div className="flex w-full items-center overflow-hidden rounded-lg border border-black-50 bg-white">
            <div className="flex min-h-[40px] min-w-0 grow items-center gap-3 px-4 py-2.5">
              <p
                className="font-normal text-sm text-foreground whitespace-nowrap overflow-hidden text-ellipsis"
                title={displayUrl}
              >
                {displayUrl}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="flex shrink-0 items-center gap-2 border-l border-black-50 bg-white px-3 py-2.5 transition-colors hover:bg-accent"
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

          {/* Social Icons */}
          <div className="flex gap-6 items-center">
            <button
              onClick={() => handleSocialShare("twitter")}
              className="flex items-center justify-center size-6 text-black-300 hover:text-black-500 transition-colors cursor-pointer"
              aria-label="Share on X (Twitter)"
            >
              <XSocial size={22} />
            </button>
            <button
              onClick={() => handleSocialShare("linkedin")}
              className="flex items-center justify-center size-6 text-black-300 hover:text-black-500 transition-colors cursor-pointer"
              aria-label="Share on LinkedIn"
            >
              <LinkedInSocial size={18} />
            </button>
            <button
              onClick={() => handleSocialShare("facebook")}
              className="flex items-center justify-center size-6 text-black-300 hover:text-black-500 transition-colors cursor-pointer"
              aria-label="Share on Facebook"
            >
              <FacebookSocial size={11} />
            </button>
            <button
              onClick={() => handleSocialShare("telegram")}
              className="flex items-center justify-center size-6 text-black-300 hover:text-black-500 transition-colors cursor-pointer"
              aria-label="Share on Telegram"
            >
              <TelegramSocial size={20} />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
