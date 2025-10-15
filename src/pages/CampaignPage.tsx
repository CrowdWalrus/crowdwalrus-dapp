/**
 * Campaign Detail Page
 *
 * Displays detailed information about a single campaign
 * Fetches campaign data from Sui blockchain and Walrus storage
 */

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCampaign } from "@/features/campaigns/hooks/useCampaign";
import { useWalrusDescription } from "@/features/campaigns/hooks/useWalrusDescription";
import { useWalrusImage } from "@/features/campaigns/hooks/useWalrusImage";
import { useCampaignUpdates } from "@/features/campaigns/hooks/useCampaignUpdates";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { CampaignBreadcrumb } from "@/features/campaigns/components/CampaignBreadcrumb";
import { CampaignHero } from "@/features/campaigns/components/CampaignHero";

import { CampaignAbout } from "@/features/campaigns/components/CampaignAbout";
import { CampaignUpdatesList } from "@/features/campaigns/components/campaign-updates";
import { DonationCard } from "@/features/campaigns/components/DonationCard";
import { useCampaignOwnership } from "@/features/campaigns/hooks/useCampaignOwnership";
import { useDeactivateCampaign } from "@/features/campaigns/hooks/useDeactivateCampaign";
import { useActivateCampaign } from "@/features/campaigns/hooks/useActivateCampaign";
import { useDeleteCampaign } from "@/features/campaigns/hooks/useDeleteCampaign";
import { OwnerViewBanner } from "@/features/campaigns/components/OwnerViewBanner";
import { DeactivateCampaignModal } from "@/features/campaigns/components/modals/DeactivateCampaignModal";
import { ActivateCampaignModal } from "@/features/campaigns/components/modals/ActivateCampaignModal";
import { DeleteCampaignModal } from "@/features/campaigns/components/modals/DeleteCampaignModal";
import { ProcessingState } from "@/features/campaigns/components/campaign-creation-modal/states/ProcessingState";
import {
  CircleCheck,
  OctagonMinus,
  Trash2,
  Pencil,
  SendIcon,
} from "lucide-react";
import { ROUTES } from "@/shared/config/routes";

const CAMPAIGN_PLACEHOLDER_IMAGE =
  "/assets/images/placeholders/campaign.png";

export function CampaignPage() {
  const { id } = useParams<{ id: string }>();
  const network = DEFAULT_NETWORK;

  // Fetch campaign data
  const { campaign, isPending, error, refetch } = useCampaign(
    id || "",
    network,
  );

  // Fetch cover image
  const { data: imageObjectUrl } = useWalrusImage(campaign?.coverImageUrl);

  // Fetch description
  const { data: description, isLoading: loadingDescription } =
    useWalrusDescription(campaign?.descriptionUrl);

  const {
    updates,
    isLoading: isUpdatesLoading,
    error: updatesError,
  } = useCampaignUpdates(id, network);

  const { isOwner, accountAddress, ownerCapId, refetchOwnership } =
    useCampaignOwnership({
      campaignId: id ?? "",
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
        await refetch();
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
        await refetch();
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
        await refetch();
        refetchOwnership();
      },
    });

  // State to toggle between owner view and public view
  const [isOwnerView, setIsOwnerView] = useState(true);
  const [activeContentTab, setActiveContentTab] = useState<"about" | "updates">(
    "about",
  );

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
    if (!id || !accountAddress) {
      return;
    }

    console.debug(
      `[CampaignPage] Wallet ${accountAddress} is ${
        isOwner ? "" : "not "
      }the owner of campaign ${id}`,
    );
  }, [id, accountAddress, isOwner]);

  const handleToggleView = () => {
    setIsOwnerView((prev) => !prev);
  };

  // Loading state
  if (isPending) {
    return (
      <div className="py-8">
        <div className="container px-4 max-w-4xl">
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
      <div className="py-8">
        <div className="container px-4 max-w-4xl">
          <Card className="border-red-500">
            <CardContent className="pt-6">
              <p className="text-red-600 font-semibold mb-2">
                Error loading campaign
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {error.message}
              </p>
              <Button variant="outline" onClick={() => refetch()}>
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
      <div className="py-8">
        <div className="container px-4 max-w-4xl">
          <Card className="border-yellow-500">
            <CardContent className="pt-6">
              <p className="text-yellow-600 font-semibold">
                Campaign not found
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Campaign ID: {id}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (campaign.isDeleted) {
    return (
      <div className="py-8">
        <div className="container px-4 max-w-4xl">
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

  // Mock contributors count and amount raised (replace with real data)
  const contributorsCount = 0;
  const amountRaised = 0;
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

  return (
    <>
      {/* Owner View Banner - Only visible to campaign owners */}
      {isOwner && (
        <OwnerViewBanner
          isOwnerView={isOwnerView}
          onToggleView={handleToggleView}
        />
      )}

      <div className="py-8">
        <div className="container px-4">
          {/* Breadcrumb */}
          <div className="pb-10">
            <CampaignBreadcrumb campaignName={campaign.name} />
          </div>
        </div>

        {/* Main content container */}
        <div className="container px-4 mx-auto max-w-[1728px]">
          {/* Page Title */}
          <h1 className="text-5xl font-bold mb-[60px] pb-10">
            {campaign.name}
          </h1>

          {/* Two-column layout */}
          <div className="flex gap-[62px] items-start">
            {/* Left Column - Main Content */}
            <div className="flex-1 max-w-[946px]">
              {/* Owner Action Buttons - Top section */}
              {isOwnerView && isOwner && (
                <div className="flex justify-end items-center gap-6 pb-10">
                  <Button
                    asChild={campaign.isActive}
                    variant="outline"
                    className="py-[9.5px]"
                    disabled={!campaign.isActive}
                  >
                    {campaign.isActive ? (
                      <Link to={`/campaigns/${campaign.id}/edit`}>
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
                  <Button
                    asChild={campaign.isActive}
                    className="py-[9.5px]"
                    disabled={!campaign.isActive}
                  >
                    {campaign.isActive ? (
                      <Link
                        to={ROUTES.CAMPAIGNS_ADD_UPDATE.replace(
                          ":id",
                          campaign.id,
                        )}
                      >
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
                  {!campaign.isActive && (
                    <Button
                      onClick={() => setIsActivateModalOpen(true)}
                      className="bg-sgreen-700 text-white-50 hover:bg-sgreen-600 py-[9.5px]"
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
                startDateMs={campaign.startDateMs}
                endDateMs={campaign.endDateMs}
                category={campaign.category}
                contributorsCount={contributorsCount}
                publisherAddress={campaign.adminId}
                socialLinks={campaign.socialLinks}
              />

              <div className="pt-10">
                <div className="flex items-center gap-6 border-b border-black-50">
                  <button
                    type="button"
                    onClick={() => setActiveContentTab("about")}
                    className={`pb-3 text-sm font-semibold transition-colors ${
                      activeContentTab === "about"
                        ? "border-b-2 border-black-500 text-black-500"
                        : "text-muted-foreground hover:text-black-500"
                    }`}
                  >
                    About
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveContentTab("updates")}
                    className={`pb-3 text-sm font-semibold transition-colors ${
                      activeContentTab === "updates"
                        ? "border-b-2 border-black-500 text-black-500"
                        : "text-muted-foreground hover:text-black-500"
                    }`}
                  >
                    Updates ({updates.length})
                  </button>
                </div>

                <div className="pt-8">
                  {activeContentTab === "about" ? (
                    <>
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
                    </>
                  ) : isUpdatesLoading ? (
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
                </div>
              </div>

              <div className="pb-10">
                <Separator />
              </div>
              {/* Deactivate and Delete Buttons - Only visible to campaign owners in owner view */}
              {isOwnerView && isOwner && (
                <>
                  <div className="flex gap-2 justify-end">
                    {campaign.isActive && (
                      <Button
                        onClick={() => setIsDeactivateModalOpen(true)}
                        className="bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 py-[9.5px]"
                      >
                        <OctagonMinus />
                        Deactivate Campaign
                      </Button>
                    )}
                    <Button
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="bg-red-50 border border-red-200 text-red-500 hover:bg-red-100"
                    >
                      <Trash2 />
                      Delete Campaign
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Right Column - Donation Card */}
            <div className="w-[480px] shrink-0 sticky top-[38px]">
              <DonationCard
                campaignId={campaign.id}
                isVerified={campaign.isVerified}
                startDateMs={campaign.startDateMs}
                endDateMs={campaign.endDateMs}
                amountRaised={amountRaised}
                contributorsCount={contributorsCount}
                fundingGoal={Number(campaign.fundingGoal)}
                recipientAddress={campaign.recipientAddress}
                isActive={campaign.isActive}
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
