/**
 * Campaign Detail Page
 *
 * Displays detailed information about a single campaign
 * Fetches campaign data from Sui blockchain and Walrus storage
 */

import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useCampaign } from "@/features/campaigns/hooks/useCampaign";
import { useResolvedCampaignId } from "@/features/campaigns/hooks/useResolvedCampaignId";
import { useWalrusDescription } from "@/features/campaigns/hooks/useWalrusDescription";
import { useWalrusImage } from "@/features/campaigns/hooks/useWalrusImage";
import { useCampaignUpdates } from "@/features/campaigns/hooks/useCampaignUpdates";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import {
  DEFAULT_NETWORK,
  useNetworkVariable,
} from "@/shared/config/networkConfig";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { CampaignBreadcrumb } from "@/features/campaigns/components/CampaignBreadcrumb";
import { CampaignHero } from "@/features/campaigns/components/CampaignHero";

import { CampaignAbout } from "@/features/campaigns/components/CampaignAbout";
import { CampaignUpdatesList } from "@/features/campaigns/components/campaign-updates";
import { DonationCard } from "@/features/campaigns/components/DonationCard";
import { useCampaignStats } from "@/features/campaigns/hooks/useCampaignStats";
import { useCampaignOwnership } from "@/features/campaigns/hooks/useCampaignOwnership";
import { useDeactivateCampaign } from "@/features/campaigns/hooks/useDeactivateCampaign";
import { useActivateCampaign } from "@/features/campaigns/hooks/useActivateCampaign";
import { useDeleteCampaign } from "@/features/campaigns/hooks/useDeleteCampaign";
import { OwnerViewBanner } from "@/features/campaigns/components/OwnerViewBanner";
import { DeactivateCampaignModal } from "@/features/campaigns/components/modals/DeactivateCampaignModal";
import { ActivateCampaignModal } from "@/features/campaigns/components/modals/ActivateCampaignModal";
import { DeleteCampaignModal } from "@/features/campaigns/components/modals/DeleteCampaignModal";
import { ProcessingState } from "@/features/campaigns/components/campaign-creation-modal/states/ProcessingState";
import { CampaignContributionsTable } from "@/features/campaigns/components/CampaignContributionsTable";
import {
  CircleCheck,
  OctagonMinus,
  Trash2,
  Pencil,
  SendIcon,
} from "lucide-react";
import { ROUTES } from "@/shared/config/routes";
import {
  buildCampaignAddUpdatePath,
  buildCampaignEditPath,
} from "@/shared/utils/routes";
import {
  CampaignResolutionError,
  CampaignResolutionLoading,
  CampaignResolutionMissing,
  CampaignResolutionNotFound,
} from "@/features/campaigns/components/CampaignResolutionStates";

const CAMPAIGN_PLACEHOLDER_IMAGE = "/assets/images/placeholders/campaign.png";

export function CampaignPage() {
  const { id } = useParams<{ id: string }>();
  const network = DEFAULT_NETWORK;
  const campaignDomain = useNetworkVariable("campaignDomain") as
    | string
    | undefined;
  const rawIdentifier = id ?? "";
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<
    "about" | "contributions" | "updates"
  >(
    tabParam === "updates"
      ? "updates"
      : tabParam === "contributions"
        ? "contributions"
        : "about",
  );

  const {
    campaignId,
    source: identifierSource,
    slug: resolvedSlug,
    fullName: resolvedFullName,
    isLoading: isResolvingIdentifier,
    notFound: isIdentifierNotFound,
    error: identifierError,
  } = useResolvedCampaignId(rawIdentifier);

  const identifierDisplay =
    resolvedFullName ?? resolvedSlug ?? rawIdentifier ?? campaignId ?? "";
  const identifierLabelFromSource =
    identifierSource === "subdomain" ? "Campaign subdomain" : "Campaign ID";

  // Fetch campaign data
  const {
    campaign,
    isPending,
    error,
    refetch: refetchCampaign,
  } = useCampaign(campaignId ?? "", network);

  const {
    recipientTotalUsdMicro: netRaisedUsdMicro,
    uniqueDonorsCount,
    isPending: isStatsPending,
    error: statsError,
    refetch: refetchCampaignStats,
  } = useCampaignStats({
    campaignId: campaign?.id ?? campaignId ?? "",
    enabled: Boolean(campaignId),
  });

  // Fetch cover image
  const { data: imageObjectUrl } = useWalrusImage(campaign?.coverImageUrl);

  // Fetch description
  const { data: description, isLoading: loadingDescription } =
    useWalrusDescription(campaign?.descriptionUrl);

  const {
    updates,
    isLoading: isUpdatesLoading,
    error: updatesError,
  } = useCampaignUpdates(campaignId, network);

  // Set dynamic page title
  useDocumentTitle(campaign?.name || "Campaign Details");

  const { isOwner, accountAddress, ownerCapId, refetchOwnership } =
    useCampaignOwnership({
      campaignId,
      network,
    });

  const { deactivateCampaign, isProcessing: isDeactivationProcessing } =
    useDeactivateCampaign({
      campaignId: campaign?.id,
      ownerCapId,
      isActive: campaign?.isActive,
      accountAddress,
      network,
      onSuccess: async () => {
        await refetchCampaign();
      },
    });
  const { activateCampaign, isProcessing: isActivationProcessing } =
    useActivateCampaign({
      campaignId: campaign?.id,
      ownerCapId,
      isActive: campaign?.isActive,
      accountAddress,
      network,
      onSuccess: async () => {
        await refetchCampaign();
      },
    });
  const { deleteCampaign, isProcessing: isDeleteProcessing } =
    useDeleteCampaign({
      campaignId: campaign?.id,
      ownerCapId,
      isDeleted: campaign?.isDeleted,
      accountAddress,
      network,
      onSuccess: async () => {
        await refetchCampaign();
        refetchOwnership();
      },
    });

  const handleDonationComplete = useCallback(async () => {
    await Promise.allSettled([refetchCampaign(), refetchCampaignStats()]);
  }, [refetchCampaign, refetchCampaignStats]);

  // State to toggle between owner view and public view
  const [isOwnerView, setIsOwnerView] = useState(true);

  // State for deactivate modal
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [processingType, setProcessingType] = useState<
    "deactivate" | "activate" | "delete" | null
  >(null);

  const handleConfirmDeactivate = async () => {
    setIsDeactivateModalOpen(false);
    setProcessingType("deactivate");

    const result = await deactivateCampaign();

    if (
      result === "user_rejected" ||
      result === "missing_owner_cap" ||
      result === "missing_wallet" ||
      result === "missing_campaign" ||
      result === "error"
    ) {
      setIsDeactivateModalOpen(true);
    }

    setProcessingType(null);
  };

  const handleConfirmActivate = async () => {
    setIsActivateModalOpen(false);
    setProcessingType("activate");

    const result = await activateCampaign();

    if (
      result === "user_rejected" ||
      result === "missing_owner_cap" ||
      result === "missing_wallet" ||
      result === "missing_campaign" ||
      result === "error"
    ) {
      setIsActivateModalOpen(true);
    }

    setProcessingType(null);
  };

  const handleConfirmDelete = async () => {
    setIsDeleteModalOpen(false);
    setProcessingType("delete");

    const result = await deleteCampaign();

    if (
      result === "user_rejected" ||
      result === "missing_owner_cap" ||
      result === "missing_wallet" ||
      result === "missing_campaign" ||
      result === "error"
    ) {
      setIsDeleteModalOpen(true);
    }

    setProcessingType(null);
  };

  useEffect(() => {
    if (!campaignId) {
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [campaignId]);

  useEffect(() => {
    if (!campaignId || !accountAddress) {
      return;
    }

    console.debug(
      `[CampaignPage] Wallet ${accountAddress} is ${
        isOwner ? "" : "not "
      }the owner of campaign ${campaignId}`,
    );
  }, [campaignId, accountAddress, isOwner]);

  const handleToggleView = () => {
    setIsOwnerView((prev) => !prev);
  };

  useEffect(() => {
    const nextTab =
      tabParam === "updates"
        ? "updates"
        : tabParam === "contributions"
          ? "contributions"
          : "about";
    setActiveTab(nextTab);
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    if (value !== "about" && value !== "contributions" && value !== "updates") {
      return;
    }

    setActiveTab(value as typeof activeTab);

    const nextParams = new URLSearchParams(searchParams);
    if (value === "about") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", value);
    }
    setSearchParams(nextParams, { replace: true });
  };

  if (!rawIdentifier && !campaignId) {
    return <CampaignResolutionMissing />;
  }

  if (isResolvingIdentifier) {
    return <CampaignResolutionLoading />;
  }

  if (identifierError) {
    return <CampaignResolutionError error={identifierError} />;
  }

  if (isIdentifierNotFound) {
    return (
      <CampaignResolutionNotFound
        identifier={identifierDisplay}
        label={identifierLabelFromSource}
      />
    );
  }

  // Loading state
  if (isPending) {
    return (
      <div className="py-4 sm:py-6 lg:py-8">
        <div className="container px-4 sm:px-6 lg:px-4 max-w-4xl">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Loading campaign...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-4 sm:py-6 lg:py-8">
        <div className="container px-4 sm:px-6 lg:px-4 max-w-4xl">
          <Card className="border-red-500">
            <CardContent className="pt-6">
              <p className="text-red-600 font-semibold mb-2">
                Error loading campaign
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {error.message}
              </p>
              <Button variant="outline" onClick={() => refetchCampaign()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Not found state
  if (!campaign) {
    return (
      <CampaignResolutionNotFound
        identifier={identifierDisplay}
        label={identifierLabelFromSource}
      />
    );
  }

  if (campaign.isDeleted) {
    return (
      <div className="py-4 sm:py-6 lg:py-8">
        <div className="container px-4 sm:px-6 lg:px-4 max-w-4xl">
          <Card className="border-red-500">
            <CardContent className="pt-6 flex flex-col gap-2">
              <p className="text-red-600 font-semibold">Campaign deleted</p>
              <p className="text-sm text-muted-foreground">
                This campaign has been permanently removed and is no longer
                available.
              </p>
              <Button variant="link" asChild>
                <Link to={ROUTES.HOME}>Back to home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const contributorsCount = statsError ? 0 : uniqueDonorsCount;
  const amountRaisedUsdMicro =
    isStatsPending || statsError ? 0n : netRaisedUsdMicro;
  const showProcessingDialog =
    (processingType === "deactivate" && isDeactivationProcessing) ||
    (processingType === "activate" && isActivationProcessing) ||
    (processingType === "delete" && isDeleteProcessing);
  const processingMessage =
    processingType === "activate"
      ? "Activating campaign..."
      : processingType === "deactivate"
        ? "Deactivating campaign..."
        : processingType === "delete"
          ? "Deleting campaign..."
          : "Processing campaign transaction...";
  const processingDescription =
    processingType === "activate"
      ? "Confirm the activation transaction in your wallet to continue."
      : processingType === "deactivate"
        ? "Confirm the deactivation transaction in your wallet to continue."
        : processingType === "delete"
          ? "Confirm the deletion transaction in your wallet to continue."
          : "Confirm the transaction in your wallet to continue.";
  const campaignHeroImageUrl =
    typeof imageObjectUrl === "string" && imageObjectUrl.trim().length > 0
      ? imageObjectUrl
      : CAMPAIGN_PLACEHOLDER_IMAGE;

  const campaignPathOptions = {
    subdomainName: campaign.subdomainName,
    campaignDomain,
  };
  const campaignFallbackId = campaign.id || campaignId || rawIdentifier;
  const editPath = campaignFallbackId
    ? buildCampaignEditPath(campaignFallbackId, campaignPathOptions)
    : null;
  const addUpdatePath = campaignFallbackId
    ? buildCampaignAddUpdatePath(campaignFallbackId, campaignPathOptions)
    : null;

  return (
    <>
      {/* Owner View Banner - Only visible to campaign owners */}
      {isOwner && (
        <OwnerViewBanner
          isOwnerView={isOwnerView}
          onToggleView={handleToggleView}
        />
      )}

      <div className="py-4 sm:py-6 lg:py-8">
        <div className="container px-4 sm:px-6 lg:px-4">
          {/* Breadcrumb */}
          <div className="pb-6 sm:pb-8 lg:pb-10">
            <CampaignBreadcrumb campaignName={campaign.name} />
          </div>
        </div>

        {/* Main content container */}
        <div className="container px-4 sm:px-6 lg:px-4 mx-auto max-w-[1728px]">
          {/* Page Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8 lg:mb-[60px] pb-6 sm:pb-8 lg:pb-10">
            {campaign.name}
          </h1>

          {/* Two-column layout */}
          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-[62px] items-start">
            {/* Left Column - Main Content */}
            <div className="flex-1 w-full lg:max-w-[946px]">
              {/* Owner Action Buttons - Top section */}
              {isOwnerView && isOwner && (
                <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 sm:gap-4 lg:gap-6 pb-6 sm:pb-8 lg:pb-10">
                  {editPath && (
                    <Button
                      asChild={campaign.isActive}
                      variant="outline"
                      className="py-[9.5px] w-full sm:w-auto"
                      disabled={!campaign.isActive}
                    >
                      {campaign.isActive ? (
                        <Link to={editPath}>
                          <Pencil />
                          Edit Campaign
                        </Link>
                      ) : (
                        <>
                          <Pencil />
                          Edit Campaign
                        </>
                      )}
                    </Button>
                  )}
                  {addUpdatePath && (
                    <Button
                      asChild={campaign.isActive}
                      className="py-[9.5px] w-full sm:w-auto"
                      disabled={!campaign.isActive}
                    >
                      {campaign.isActive ? (
                        <Link to={addUpdatePath}>
                          <SendIcon />
                          Post an Update
                        </Link>
                      ) : (
                        <>
                          <SendIcon />
                          Post an Update
                        </>
                      )}
                    </Button>
                  )}
                  {!campaign.isActive && (
                    <Button
                      onClick={() => setIsActivateModalOpen(true)}
                      className="bg-sgreen-700 text-white-50 hover:bg-sgreen-600 py-[9.5px] w-full sm:w-auto"
                    >
                      <CircleCheck />
                      Activate Campaign
                    </Button>
                  )}
                </div>
              )}

              {/* Hero Section */}
              <CampaignHero
                coverImageUrl={campaignHeroImageUrl}
                campaignName={campaign.name}
                shortDescription={campaign.shortDescription}
                isActive={campaign.isActive}
                isDeleted={campaign.isDeleted}
                startDateMs={campaign.startDateMs}
                endDateMs={campaign.endDateMs}
                category={campaign.category}
                contributorsCount={contributorsCount}
                publisherAddress={campaign.creatorAddress}
                socialLinks={campaign.socialLinks}
              />

              <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className="pt-6 sm:pt-8 lg:pt-10"
              >
                <TabsList className="bg-white-500 rounded-xl p-1 w-full sm:w-auto">
                  <TabsTrigger value="about" className="flex-1 sm:flex-none">
                    About
                  </TabsTrigger>
                  <TabsTrigger
                    value="contributions"
                    className="flex-1 sm:flex-none"
                  >
                    Contributions
                  </TabsTrigger>
                  <TabsTrigger value="updates" className="flex-1 sm:flex-none">
                    Updates ({updates.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="pt-4 sm:pt-6 lg:pt-8">
                  {loadingDescription ? (
                    <p className="text-muted-foreground">
                      Loading description...
                    </p>
                  ) : description ? (
                    <CampaignAbout description={description} />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No description available for this campaign.
                    </p>
                  )}
                </TabsContent>

                <TabsContent
                  value="contributions"
                  className="pt-4 sm:pt-6 lg:pt-8"
                >
                  <CampaignContributionsTable campaignId={campaign.id} />
                </TabsContent>

                <TabsContent value="updates" className="pt-4 sm:pt-6 lg:pt-8">
                  {isUpdatesLoading ? (
                    <p className="text-muted-foreground">Loading updates...</p>
                  ) : updatesError ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-semibold text-red-600">
                        Failed to load updates
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {updatesError.message}
                      </p>
                    </div>
                  ) : (
                    <CampaignUpdatesList updates={updates} />
                  )}
                </TabsContent>
              </Tabs>

              {/* Deactivate and Delete Buttons - Only visible to campaign owners in owner view */}
              {isOwnerView && isOwner && (
                <>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 justify-end pt-6">
                    {campaign.isActive && (
                      <Button
                        onClick={() => setIsDeactivateModalOpen(true)}
                        className="bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 py-[9.5px] w-full sm:w-auto"
                      >
                        <OctagonMinus />
                        Deactivate Campaign
                      </Button>
                    )}
                    <Button
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 w-full sm:w-auto"
                    >
                      <Trash2 />
                      Delete Campaign
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Right Column - Donation Card */}
            <div className="w-full lg:w-[480px] lg:shrink-0 lg:sticky lg:top-[38px]">
              {statsError && (
                <div className="mb-4 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
                  <p className="font-semibold">
                    Live stats temporarily unavailable
                  </p>
                  <p className="text-orange-800">
                    {statsError.message ||
                      "We couldn't load the latest totals. Please refresh or try again later."}
                  </p>
                </div>
              )}
              <DonationCard
                campaignId={campaign.id}
                statsId={campaign.statsId}
                isVerified={campaign.isVerified}
                isOwner={isOwner}
                isOwnerView={isOwnerView}
                startDateMs={campaign.startDateMs}
                endDateMs={campaign.endDateMs}
                campaignName={campaign.name}
                raisedUsdMicro={amountRaisedUsdMicro}
                contributorsCount={contributorsCount}
                fundingGoalUsdMicro={campaign.fundingGoalUsdMicro}
                recipientAddress={campaign.recipientAddress}
                ownerAddress={campaign.creatorAddress}
                isActive={campaign.isActive}
                isDeleted={campaign.isDeleted}
                subdomainName={campaign.subdomainName}
                campaignDomain={campaignDomain}
                platformBps={campaign.payoutPlatformBps}
                onDonationComplete={handleDonationComplete}
                onViewUpdates={() => handleTabChange("updates")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Status Modals */}
      {campaign.isActive && (
        <DeactivateCampaignModal
          open={isDeactivateModalOpen}
          onClose={() => setIsDeactivateModalOpen(false)}
          onConfirm={handleConfirmDeactivate}
        />
      )}

      {!campaign.isActive && (
        <ActivateCampaignModal
          open={isActivateModalOpen}
          onClose={() => setIsActivateModalOpen(false)}
          onConfirm={handleConfirmActivate}
        />
      )}

      <DeleteCampaignModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      {showProcessingDialog && (
        <Dialog open onOpenChange={() => {}}>
          <DialogContent className="max-w-md px-10 py-12 rounded-2xl bg-white-50 [&>button]:hidden">
            <ProcessingState
              message={processingMessage}
              description={processingDescription}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
