import { useState, useMemo, useEffect, useCallback } from "react";
import { ConnectButton } from "@mysten/dapp-kit";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Button } from "@/shared/components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/components/ui/alert";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/components/ui/pagination";
import { Filter, AlertCircle, Loader2 } from "lucide-react";
import {
  useCrowdWalrusAdminCaps,
  useCrowdWalrusAdminState,
  useVerifyCampaign,
  useUnverifyCampaign,
  useCreateVerifyCap,
} from "@/features/admin";
import { useCampaignsPage } from "@/features/campaigns/hooks/useCampaignsPage";
import type { CampaignData } from "@/features/campaigns/hooks/useAllCampaigns";
import {
  CampaignCard,
  CampaignVerificationModal,
  type CampaignVerificationAction,
} from "@/features/admin/components";
import { VerifierManagementPanel } from "@/features/admin/components/VerifierManagementPanel";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { getPaginationItems } from "@/shared/lib/pagination";
import { cn } from "@/shared/lib/utils";
import { getCampaignById } from "@/services/indexer-services";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import {
  campaignsPageQueryKey,
  fetchCampaignsPage,
} from "@/hooks/indexer/useCampaignsPage";

type TabValue = "all" | "verified" | "unverified";
const VERIFICATION_PROPAGATION_ATTEMPTS = 6;
const VERIFICATION_PROPAGATION_DELAY_MS = 800;
const INDEXER_SYNC_DELAY_MS = 5000;
const CAMPAIGNS_PAGE_SIZE = 12;

const normalizeCampaignId = (id: string): string => {
  try {
    return normalizeSuiAddress(id);
  } catch {
    return id.toLowerCase();
  }
};

export function AdminPage() {
  useDocumentTitle("Admin Dashboard");
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  // Fetch admin capabilities
  const {
    adminCapId,
    primaryVerifyCapId,
    hasAdminCap,
    hasVerifierAccess,
    accountAddress,
    isLoading: isCapsLoading,
    error: capsError,
    refetch: refetchCaps,
  } = useCrowdWalrusAdminCaps();

  // Fetch CrowdWalrus state (verified campaign list)
  const {
    verifiedCampaignIdSet,
    isLoading: isStateLoading,
    error: stateError,
    refetch: refetchState,
  } = useCrowdWalrusAdminState();

  const isCampaignVerified = useCallback(
    (campaign: CampaignData) => {
      const normalizedId = normalizeCampaignId(campaign.id);
      return (
        campaign.isVerified ||
        verifiedCampaignIdSet.has(normalizedId) ||
        verifiedCampaignIdSet.has(campaign.id.toLowerCase())
      );
    },
    [verifiedCampaignIdSet],
  );

  const verificationStatus =
    activeTab === "verified"
      ? "verified"
      : activeTab === "unverified"
        ? "unverified"
        : "all";

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Fetch campaigns for the active tab
  const {
    campaigns: currentPageData,
    totalCount,
    isPending: isCampaignsLoading,
    isFetching: isCampaignsFetching,
    isPlaceholderData: isCampaignsPlaceholder,
    error: campaignsError,
    refetch: refetchCampaigns,
  } = useCampaignsPage(DEFAULT_NETWORK, {
    page: currentPage,
    pageSize: CAMPAIGNS_PAGE_SIZE,
    verificationStatus,
  });

  // Create verifier hook (for admin panel)
  const { createVerifyCap, isProcessing: isCreatingCap } = useCreateVerifyCap({
    adminCapId,
    accountAddress,
    onSuccess: async () => {
      await refetchCaps();
    },
  });

  const totalPages =
    totalCount > 0 ? Math.ceil(totalCount / CAMPAIGNS_PAGE_SIZE) : 0;
  const paginationItems = useMemo(
    () =>
      getPaginationItems({
        currentPage,
        totalPages,
      }),
    [currentPage, totalPages],
  );

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (totalPages <= 1) return;

    const nextPage = currentPage + 1;
    const prevPage = currentPage - 1;

    if (nextPage <= totalPages) {
      void queryClient.prefetchQuery({
        queryKey: campaignsPageQueryKey({
          page: nextPage,
          pageSize: CAMPAIGNS_PAGE_SIZE,
          verificationStatus,
        }),
        queryFn: () =>
          fetchCampaignsPage({
            page: nextPage,
            pageSize: CAMPAIGNS_PAGE_SIZE,
            verificationStatus,
          }),
        staleTime: 30_000,
      });
    }

    if (prevPage >= 1) {
      void queryClient.prefetchQuery({
        queryKey: campaignsPageQueryKey({
          page: prevPage,
          pageSize: CAMPAIGNS_PAGE_SIZE,
          verificationStatus,
        }),
        queryFn: () =>
          fetchCampaignsPage({
            page: prevPage,
            pageSize: CAMPAIGNS_PAGE_SIZE,
            verificationStatus,
          }),
        staleTime: 30_000,
      });
    }
  }, [
    queryClient,
    currentPage,
    totalPages,
    verificationStatus,
  ]);

  const isLoadingPage =
    isCampaignsLoading ||
    (isCampaignsFetching &&
      isCampaignsPlaceholder &&
      currentPageData.length === 0);

  function handleSelectPage(targetPage: number) {
    if (
      targetPage < 1 ||
      targetPage === currentPage ||
      (totalPages > 0 && targetPage > totalPages)
    ) {
      return;
    }

    setCurrentPage(targetPage);
  }

  const canGoPrev = currentPage > 1;
  const canGoNext = totalPages > 0 && currentPage < totalPages;

  // Loading state
  const isLoading = isCapsLoading || isStateLoading || isLoadingPage;

  // Error state
  const error = capsError || stateError || campaignsError;

  // Wallet not connected
  if (!accountAddress) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert className="border-orange-500 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900 font-semibold">
            Wallet Connection Required
          </AlertTitle>
          <AlertDescription className="text-orange-800">
            Please connect your wallet to access the admin dashboard.
          </AlertDescription>
          <div className="mt-4">
            <ConnectButton />
          </div>
        </Alert>
      </div>
    );
  }

  // No verifier access
  if (!isLoading && !hasVerifierAccess) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert className="border-destructive bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertTitle className="text-destructive font-semibold">
            Access Denied
          </AlertTitle>
          <AlertDescription className="text-destructive/90">
            You don't have verifier access. Please contact an admin to receive a
            VerifyCap for this wallet address.
          </AlertDescription>
          <p className="mt-2 text-sm text-muted-foreground">
            Your address: {accountAddress}
          </p>
        </Alert>
      </div>
    );
  }

  // Show error
  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert className="border-destructive bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertTitle className="text-destructive font-semibold">
            Error Loading Data
          </AlertTitle>
          <AlertDescription className="text-destructive/90">
            {error.message || "An unexpected error occurred."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <h1 className="font-bold text-[40px] leading-tight tracking-[0.4px] text-black-500">
            Hey! Admin 👋🏻
          </h1>
          <p className="text-base text-black-400 leading-relaxed">
            Check published campaigns and verify them to get listed on
            CrowdWalrus.
          </p>
        </div>

        {/* Tabs and Filters */}
        <div className="flex items-center justify-between gap-4">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TabValue)}
            className="w-auto"
          >
            <TabsList className="bg-white-500 p-1 rounded-xl gap-2">
              <TabsTrigger
                value="all"
                className="rounded-[10px] px-2.5 py-1.5 text-sm font-medium data-[state=active]:bg-white-50 data-[state=active]:shadow-sm"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="verified"
                className="rounded-[10px] px-2.5 py-1.5 text-sm font-medium data-[state=active]:bg-white-50 data-[state=active]:shadow-sm"
              >
                Verified
              </TabsTrigger>
              <TabsTrigger
                value="unverified"
                className="rounded-[10px] px-2.5 py-1.5 text-sm font-medium data-[state=active]:bg-white-50 data-[state=active]:shadow-sm"
              >
                Unverified
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="outline"
            className="bg-white-50 border-black-50 rounded-lg px-6 py-2.5 gap-2 min-h-[40px]"
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
          </Button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}

        {/* Campaign Grid */}
        {!isLoading && (
          <>
            {currentPageData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-black-400 text-base">
                  No {activeTab !== "all" ? activeTab : ""} campaigns found.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {currentPageData.map((campaign) => {
                  const isVerified = isCampaignVerified(campaign);

                  return (
                    <CampaignCardWithActions
                      key={campaign.id}
                      campaign={campaign}
                      isVerified={isVerified}
                      primaryVerifyCapId={primaryVerifyCapId}
                      accountAddress={accountAddress}
                      onRefetch={async () => {
                        await Promise.all([
                          refetchState(),
                          refetchCaps(),
                          refetchCampaigns(),
                        ]);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

        {!isLoading && totalPages > 1 && (
          <Pagination className="pt-2">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  className={cn(
                    !canGoPrev && "pointer-events-none opacity-50",
                  )}
                  onClick={(event) => {
                    event.preventDefault();
                    if (canGoPrev) {
                      void handleSelectPage(currentPage - 1);
                    }
                  }}
                />
              </PaginationItem>
              {paginationItems.map((item, index) =>
                item === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      href="#"
                      isActive={item === currentPage}
                      onClick={(event) => {
                        event.preventDefault();
                        void handleSelectPage(item);
                      }}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  className={cn(
                    !canGoNext && "pointer-events-none opacity-50",
                  )}
                  onClick={(event) => {
                    event.preventDefault();
                    if (canGoNext) {
                      void handleSelectPage(currentPage + 1);
                    }
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        {/* Verifier Management Panel (Admin Only) */}
        {hasAdminCap && !isLoading && (
          <div className="mt-8">
            <VerifierManagementPanel
              onGrantAccess={async (address: string) => {
                await createVerifyCap(address);
              }}
              isProcessing={isCreatingCap}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Separate component to handle verify/unverify actions per campaign
interface CampaignCardWithActionsProps {
  campaign: CampaignData;
  isVerified: boolean;
  primaryVerifyCapId: string | null;
  accountAddress: string | null;
  onRefetch: () => Promise<void>;
}

function CampaignCardWithActions({
  campaign,
  isVerified,
  primaryVerifyCapId,
  accountAddress,
  onRefetch,
}: CampaignCardWithActionsProps) {
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] =
    useState<CampaignVerificationAction | null>(null);
  const [isAwaitingPropagation, setIsAwaitingPropagation] = useState(false);
  const { verifyCampaign, isProcessing: isVerifying } = useVerifyCampaign({
    campaignId: campaign.id,
    verifyCapId: primaryVerifyCapId,
    accountAddress,
    isVerified,
  });

  const { unverifyCampaign, isProcessing: isUnverifying } = useUnverifyCampaign(
    {
      campaignId: campaign.id,
      verifyCapId: primaryVerifyCapId,
      accountAddress,
      isVerified,
    },
  );

  const isSubmitting =
    (pendingAction === "verify"
      ? isVerifying
      : pendingAction === "unverify"
        ? isUnverifying
        : false) || isAwaitingPropagation;

  const waitForVerificationPropagation = useCallback(
    async (expectedVerified: boolean) => {
      for (
        let attempt = 0;
        attempt < VERIFICATION_PROPAGATION_ATTEMPTS;
        attempt += 1
      ) {
        try {
          const detail = await getCampaignById(campaign.id);
          if (detail?.isVerified === expectedVerified) {
            return;
          }
        } catch (error) {
          console.warn(
            `[AdminPage] Refetch failed during verification wait for ${campaign.id}:`,
            error,
          );
        }

        await new Promise((resolve) =>
          setTimeout(
            resolve,
            VERIFICATION_PROPAGATION_DELAY_MS * (attempt + 1),
          ),
        );
      }
    },
    [campaign.id],
  );

  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    const action = pendingAction;
    const expectedVerified = action === "verify";
    const result =
      action === "verify" ? await verifyCampaign() : await unverifyCampaign();

    const shouldSync =
      result === "success" ||
      result === "already_verified" ||
      result === "already_unverified";

    if (shouldSync) {
      setIsAwaitingPropagation(true);
      try {
        await Promise.all([
          waitForVerificationPropagation(expectedVerified),
          new Promise((resolve) => setTimeout(resolve, INDEXER_SYNC_DELAY_MS)),
        ]);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["indexer", "campaign"] }),
          queryClient.invalidateQueries({ queryKey: ["indexer", "campaigns"] }),
        ]);
        await onRefetch();
      } finally {
        setIsAwaitingPropagation(false);
      }
    }

    setPendingAction(null);
  };

  return (
    <>
      <CampaignCard
        campaign={campaign}
        isVerified={isVerified}
        isProcessing={isVerifying || isUnverifying || isAwaitingPropagation}
        onVerify={() => setPendingAction("verify")}
        onUnverify={() => setPendingAction("unverify")}
        canTakeAction={Boolean(primaryVerifyCapId)}
        raisedUsdMicro={campaign.recipientTotalUsdMicro}
        supportersCount={campaign.uniqueDonorsCount}
      />
      <CampaignVerificationModal
        open={pendingAction !== null}
        action={pendingAction ?? "verify"}
        campaignName={campaign.name}
        onClose={() => {
          if (!isSubmitting) {
            setPendingAction(null);
          }
        }}
        onConfirm={handleConfirmAction}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
