import { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, SendHorizontal, Wallet } from "lucide-react";

import { MyCampaignCardContainer } from "./MyCampaignCardContainer";
import type { CampaignData } from "@/features/campaigns/hooks/useAllCampaigns";
import { CampaignCardWithStats } from "@/features/campaigns/components/CampaignCardWithStats";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { ROUTES } from "@/shared/config/routes";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";

interface CampaignDataSource {
  campaigns: CampaignData[];
  isPending: boolean;
  error: Error | null;
  refetch: () => void | Promise<void>;
  hasNoCampaigns: boolean;
  isConnected?: boolean;
}

interface MyCampaignsSectionProps {
  data: CampaignDataSource;
  network?: SupportedNetwork;
  isOwnerView?: boolean;
  profileDisplayName?: string;
}

function MyCampaignCardSkeleton() {
  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-black-50 bg-white px-6 py-6 shadow-sm md:flex-row md:gap-8 md:px-8 md:py-8">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-6 w-28 rounded-lg" />
            <Skeleton className="h-6 w-32 rounded-lg" />
          </div>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-7 w-3/4 rounded-md" />
            <Skeleton className="h-5 w-full rounded-md" />
            <Skeleton className="h-6 w-32 rounded-lg" />
          </div>
        </div>

        <Skeleton className="h-px w-full rounded-none" />

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-4 w-36 rounded-md" />
            </div>
            <Skeleton className="h-6 w-32 rounded-lg" />
          </div>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-2.5 w-full rounded-full" />
            <Skeleton className="h-5 w-2/3 rounded-md" />
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-3 rounded-2xl border border-white-600 bg-white-50 p-4 md:w-[220px] md:border-0 md:bg-transparent md:p-0">
        <Skeleton className="h-5 w-32 rounded-md" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function MyCampaignsSection({
  data,
  network = DEFAULT_NETWORK,
  isOwnerView = true,
  profileDisplayName,
}: MyCampaignsSectionProps) {
  const {
    campaigns,
    isPending,
    error,
    refetch,
    hasNoCampaigns,
    isConnected = true,
  } = data;

  const handleMutation = useCallback(() => {
    void refetch();
  }, [refetch]);

  const campaignList = useMemo(
    () =>
      campaigns.map((campaign) => (
        <MyCampaignCardContainer
          key={campaign.id}
          campaign={campaign}
          network={network}
          onMutation={handleMutation}
        />
      )),
    [campaigns, handleMutation, network],
  );

  if (isOwnerView && !isConnected) {
    return (
      <Card className="border-dashed border-black-50 bg-white">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-white-500 text-black-400">
            <Wallet className="size-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-black-500">
              Connect your wallet
            </h3>
            <p className="text-sm text-black-300">
              Link your wallet to see campaigns you have created.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isPending) {
    return isOwnerView ? (
      <div className="flex flex-col gap-6">
        <MyCampaignCardSkeleton />
        <MyCampaignCardSkeleton />
      </div>
    ) : (
      <div className="grid gap-6 md:grid-cols-2">
        <CampaignCardSkeleton />
        <CampaignCardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border border-red-200 bg-red-50">
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
          <AlertCircle className="size-8 text-red-500" />
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-red-600">
              Unable to load your campaigns
            </h3>
            <p className="text-sm text-red-500">{error.message}</p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (hasNoCampaigns) {
    const fallbackName = profileDisplayName?.trim() || "This creator";
    const emptyHeading = isOwnerView
      ? "You have not launched any campaigns yet"
      : `${fallbackName} has not launched any campaigns yet`;
    const emptyBody = isOwnerView
      ? "Start your first campaign to raise funds with CrowdWalrus."
      : "When they launch a campaign, it will appear here.";

    return (
      <Card className="border-dashed border-black-50 bg-white">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-white-500 text-black-400">
            <SendHorizontal className="size-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-black-500">
              {emptyHeading}
            </h3>
            <p className="text-sm text-black-300">{emptyBody}</p>
          </div>
          {isOwnerView ? (
            <Button asChild className="h-10 rounded-lg px-6">
              <Link to={ROUTES.CAMPAIGNS_NEW}>Create a campaign</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (!isOwnerView) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {campaigns.map((campaign) => (
          <CampaignCardWithStats key={campaign.id} campaign={campaign} />
        ))}
      </div>
    );
  }

  return <div className="flex flex-col gap-6">{campaignList}</div>;
}

function CampaignCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-[24px] border border-black-50 bg-white">
      <Skeleton className="h-52 w-full" />
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-px w-full" />
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
