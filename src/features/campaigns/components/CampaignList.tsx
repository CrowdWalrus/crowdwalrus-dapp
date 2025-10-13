/**
 * CampaignList Component
 *
 * Displays all campaigns created on the platform
 * Fetches campaign data from Sui blockchain and Walrus storage
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  useMyCampaigns,
  type CampaignData,
} from "@/features/campaigns/hooks/useMyCampaigns";
import { SOCIAL_PLATFORM_CONFIG } from "@/features/campaigns/constants/socialPlatforms";
import { getContractConfig } from "@/shared/config/contracts";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import { EditorViewer } from "@/shared/components/editor/blocks/editor-00/viewer";
import { SerializedEditorState } from "lexical";
import { formatSubdomain } from "@/shared/utils/subdomain";

interface CampaignCardProps {
  campaign: CampaignData;
  network: "devnet" | "testnet" | "mainnet";
}

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
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
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
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}

/**
 * Component to render description preview from Lexical JSON
 */
function DescriptionPreview({ description }: { description: string }) {
  let editorState: SerializedEditorState | null = null;

  try {
    editorState = JSON.parse(description);
  } catch (error) {
    console.error("Failed to parse description JSON:", error);
    return (
      <div className="pt-2 border-t">
        <p className="text-xs text-muted-foreground mb-1">
          Description (from Walrus)
        </p>
        <div className="text-sm bg-gray-50 px-3 py-2 rounded">
          <p className="text-red-600 text-xs">Failed to load description</p>
        </div>
      </div>
    );
  }

  if (!editorState) {
    return (
      <div className="pt-2 border-t">
        <p className="text-xs text-muted-foreground mb-1">
          Description (from Walrus)
        </p>
        <div className="text-sm bg-gray-50 px-3 py-2 rounded">
          <p className="text-red-600 text-xs">Invalid description format</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2 border-t">
      <p className="text-xs text-muted-foreground mb-1">
        Description (from Walrus)
      </p>
      <div className="text-sm bg-gray-50 px-3 py-2 rounded max-h-32 overflow-y-auto prose prose-sm">
        <EditorViewer editorSerializedState={editorState} />
      </div>
    </div>
  );
}

/**
 * Individual campaign card component
 */
function CampaignCard({ campaign, network }: CampaignCardProps) {
  const [imageError, setImageError] = useState(false);

  // Debug: Log cover image URL
  console.log("Campaign:", campaign.name);
  console.log("Cover Image URL:", campaign.coverImageUrl);
  console.log("Walrus Quilt ID:", campaign.walrusQuiltId);

  // Fetch image using React Query
  const {
    data: imageObjectUrl,
    isLoading: loadingImage,
    error: imageQueryError,
  } = useWalrusImage(campaign.coverImageUrl);

  // Fetch description using React Query
  const { data: description, isLoading: loadingDescription } =
    useWalrusDescription(campaign.descriptionUrl);

  // Handle image error
  if (imageQueryError) {
    if (!imageError) {
      console.error("Error fetching image:", imageQueryError);
      setImageError(true);
    }
  }

  // Cleanup object URL on unmount or URL change
  useEffect(() => {
    return () => {
      if (imageObjectUrl) {
        URL.revokeObjectURL(imageObjectUrl);
      }
    };
  }, [imageObjectUrl]);

  // Format dates
  const formatDate = (timestampMs: number) => {
    if (!Number.isFinite(timestampMs) || timestampMs <= 0) {
      return "Unknown";
    }
    return new Date(timestampMs).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  const { campaignDomain } = getContractConfig(network);
  const fullSubdomain = formatSubdomain(campaign.subdomainName, campaignDomain);
  const socialLinks = campaign.socialLinks ?? [];
  const platformTotals = socialLinks.reduce<Record<string, number>>((acc, link) => {
    const key = link.platform;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const platformRenderedCounts: Record<string, number> = {};

  return (
    <Card className="overflow-hidden">
      {/* Cover Image */}
      <div className="w-full h-48 bg-gray-200 overflow-hidden">
        {loadingImage ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600">
            <p className="text-sm">Loading image...</p>
          </div>
        ) : imageObjectUrl && !imageError ? (
          <img
            src={imageObjectUrl}
            alt={campaign.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-300 text-gray-600 p-4">
            <p className="text-sm font-semibold">
              {imageError ? "Image failed to load" : "No image"}
            </p>
            {imageError && campaign.coverImageUrl && (
              <p className="text-xs mt-2 break-all text-center">
                {campaign.coverImageUrl}
              </p>
            )}
          </div>
        )}
      </div>

      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-xl">{campaign.name}</CardTitle>
            <CardDescription className="mt-1">
              {campaign.shortDescription}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-1">
            {campaign.isVerified && (
              <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">
                Verified
              </span>
            )}
            <span
              className={`px-2 py-1 text-xs font-semibold rounded ${
                campaign.isActive
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {campaign.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Campaign Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Funding Goal</p>
            <p className="font-semibold">{campaign.fundingGoal} SUI</p>
          </div>
          <div>
            <p className="text-muted-foreground">Category</p>
            <p className="font-semibold">{campaign.category}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Start Date</p>
            <p className="font-semibold">{formatDate(campaign.startDateMs)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">End Date</p>
            <p className="font-semibold">{formatDate(campaign.endDateMs)}</p>
          </div>
        </div>

        {/* Subdomain */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-1">Campaign URL</p>
          <p className="text-sm font-mono bg-gray-50 px-2 py-1 rounded break-all">
            {fullSubdomain}
          </p>
        </div>

        {/* Walrus Description Preview */}
        {description && <DescriptionPreview description={description} />}

        {loadingDescription && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Loading description from Walrus...
            </p>
          </div>
        )}

        {/* Social Links */}
        {socialLinks.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Social Links</p>
            <div className="flex flex-col gap-1">
              {socialLinks.map((link, index) => {
                const config =
                  SOCIAL_PLATFORM_CONFIG[
                    link.platform as keyof typeof SOCIAL_PLATFORM_CONFIG
                  ];
                const baseLabel =
                  config?.label ??
                  `${link.platform.charAt(0).toUpperCase()}${link.platform.slice(1)}`;
                const occurrence =
                  (platformRenderedCounts[link.platform] ?? 0) + 1;
                platformRenderedCounts[link.platform] = occurrence;
                const suffix = platformTotals[link.platform] > 1 ? ` #${occurrence}` : "";
                const label = `${baseLabel}${suffix}`;

                return (
                  <a
                    key={`${link.platform}-${index}-${link.url}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {label}
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Campaign ID (for debugging) */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-1">Campaign ID</p>
          <p className="text-xs font-mono bg-gray-50 px-2 py-1 rounded break-all">
            {campaign.id}
          </p>
        </div>

        {/* Walrus Blob ID */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Walrus Blob ID</p>
          <p className="text-xs font-mono bg-gray-50 px-2 py-1 rounded break-all">
            {campaign.walrusQuiltId || "Not available"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main CampaignList component
 */
export function CampaignList() {
  const network = DEFAULT_NETWORK;
  const { campaigns, isPending, error, hasNoCampaigns, refetch } =
    useMyCampaigns(network);

  // Loading state
  if (isPending) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading campaigns...</p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-red-500">
        <CardContent className="pt-6">
          <p className="text-red-600 font-semibold mb-2">
            Error loading campaigns
          </p>
          <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (hasNoCampaigns) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            No campaigns have been created yet. Be the first to create a
            campaign!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Display campaigns
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">All Campaigns</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            network={network}
          />
        ))}
      </div>
    </div>
  );
}
