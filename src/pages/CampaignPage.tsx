/**
 * Campaign Detail Page
 *
 * Displays detailed information about a single campaign
 * Fetches campaign data from Sui blockchain and Walrus storage
 */

import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useCampaign } from "@/features/campaigns/hooks/useCampaign";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { CampaignBreadcrumb } from "@/features/campaigns/components/CampaignBreadcrumb";
import { CampaignHero } from "@/features/campaigns/components/CampaignHero";

import { CampaignAbout } from "@/features/campaigns/components/CampaignAbout";
import { DonationCard } from "@/features/campaigns/components/DonationCard";

/**
 * Hook to fetch image from Walrus as blob and create object URL
 */
function useWalrusImage(imageUrl: string) {
  return useQuery({
    queryKey: ["walrus-image", imageUrl],
    queryFn: async () => {
      if (!imageUrl) return null;

      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    },
    enabled: !!imageUrl,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch campaign description from Walrus
 */
function useWalrusDescription(descriptionUrl: string) {
  return useQuery({
    queryKey: ["walrus-description", descriptionUrl],
    queryFn: async () => {
      if (!descriptionUrl) return "";

      const response = await fetch(descriptionUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch description: ${response.statusText}`);
      }
      return await response.text();
    },
    enabled: !!descriptionUrl,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function CampaignPage() {
  const { id } = useParams<{ id: string }>();
  const network = DEFAULT_NETWORK;

  // Fetch campaign data
  const { campaign, isPending, error, refetch } = useCampaign(
    id || "",
    network,
  );

  // Fetch cover image
  const { data: imageObjectUrl, isLoading: loadingImage } = useWalrusImage(
    campaign?.coverImageUrl || "",
  );

  // Fetch description
  const { data: description, isLoading: loadingDescription } =
    useWalrusDescription(campaign?.descriptionUrl || "");

  // Loading state
  if (isPending) {
    return (
      <div className="py-8">
        <div className="container max-w-4xl">
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
        <div className="container max-w-4xl">
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
        <div className="container max-w-4xl">
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

  // Mock contributors count and amount raised (replace with real data)
  const contributorsCount = 0;
  const amountRaised = 0;

  return (
    <div className="py-8">
      <div className="container">
        {/* Breadcrumb */}
        <div className="pb-10">
          <CampaignBreadcrumb campaignName={campaign.name} />
        </div>
      </div>

      {/* Main content container */}
      <div className="container mx-auto max-w-[1728px]">
        {/* Page Title */}
        <h1 className="text-5xl font-bold mb-[60px] pb-10">{campaign.name}</h1>

        {/* Two-column layout */}
        <div className="flex gap-[62px] items-start">
          {/* Left Column - Main Content */}
          <div className="flex-1 max-w-[946px]">
            {/* Hero Section */}
            {imageObjectUrl && !loadingImage && (
              <CampaignHero
                coverImageUrl={imageObjectUrl}
                campaignName={campaign.name}
                shortDescription={campaign.shortDescription}
                isActive={campaign.isActive}
                isVerified={campaign.isVerified}
                startDateMs={campaign.startDateMs}
                category={campaign.category}
                contributorsCount={contributorsCount}
                publisherAddress={campaign.adminId}
                socialLinks={campaign.socialLinks}
              />
            )}

            {/* About Section */}
            {description && !loadingDescription && (
              <div className="pt-10">
                <CampaignAbout description={description} />
              </div>
            )}

            {/* Loading state for description */}
            {loadingDescription && (
              <div className="py-8">
                <p className="text-muted-foreground">Loading description...</p>
              </div>
            )}
          </div>

          {/* Right Column - Donation Card */}
          <div className="w-[480px] shrink-0 sticky top-[38px]">
            <DonationCard
              campaignId={campaign.id}
              isVerified={campaign.isVerified}
              startDateMs={campaign.startDateMs}
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
  );
}
