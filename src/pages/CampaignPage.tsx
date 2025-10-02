/**
 * Campaign Detail Page
 *
 * Displays detailed information about a single campaign
 * Fetches campaign data from Sui blockchain and Walrus storage
 */

import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useCampaign } from "@/features/campaigns/hooks/useCampaign";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { EditorViewer } from "@/shared/components/editor/blocks/editor-00/viewer";
import { SerializedEditorState } from "lexical";

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
  const network = "testnet" as const;

  // Fetch campaign data
  const { campaign, isPending, error, refetch } = useCampaign(
    id || "",
    network,
  );

  // Fetch cover image
  const {
    data: imageObjectUrl,
    isLoading: loadingImage,
    error: imageError,
  } = useWalrusImage(campaign?.coverImageUrl || "");

  // Fetch description
  const { data: description, isLoading: loadingDescription } =
    useWalrusDescription(campaign?.descriptionUrl || "");

  // Format dates
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading state
  if (isPending) {
    return (
      <div className="mt-5 pt-2 px-4 container max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Loading campaign...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mt-5 pt-2 px-4 container max-w-4xl">
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
    );
  }

  // Not found state
  if (!campaign) {
    return (
      <div className="mt-5 pt-2 px-4 container max-w-4xl">
        <Card className="border-yellow-500">
          <CardContent className="pt-6">
            <p className="text-yellow-600 font-semibold">Campaign not found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Campaign ID: {id}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subdomainSuffix =
    network === "testnet" ? ".crowdwalrus-test.sui" : ".crowdwalrus.sui";
  const fullSubdomain = campaign.subdomainName.includes(".sui")
    ? campaign.subdomainName
    : campaign.subdomainName + subdomainSuffix;

  return (
    <div className="mt-5 pt-2 px-4 container max-w-4xl pb-8">
      <h1 className="text-4xl font-bold mb-6">Campaign Details</h1>

      {/* Cover Image */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Cover Image</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-96 bg-gray-200 overflow-hidden rounded-lg">
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
                  <p className="text-xs mt-2 break-all text-center max-w-xl">
                    {campaign.coverImageUrl}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-2xl">{campaign.name}</CardTitle>
              <CardDescription className="mt-2 text-base">
                {campaign.shortDescription}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2">
              {campaign.validated && (
                <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">
                  Validated
                </span>
              )}
              <span
                className={`px-3 py-1 text-xs font-semibold rounded ${
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
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Funding Goal</p>
              <p className="text-lg font-semibold">
                {campaign.fundingGoal} SUI
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Category</p>
              <p className="text-lg font-semibold">{campaign.category}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Start Date</p>
              <p className="text-sm">{formatDate(campaign.startDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">End Date</p>
              <p className="text-sm">{formatDate(campaign.endDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Created At</p>
              <p className="text-sm">{formatDate(campaign.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full Description */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingDescription ? (
            <p className="text-sm text-muted-foreground">
              Loading description from Walrus...
            </p>
          ) : description ? (
            (() => {
              try {
                const editorState: SerializedEditorState =
                  JSON.parse(description);
                return <EditorViewer editorSerializedState={editorState} />;
              } catch (error) {
                console.error("Failed to parse description JSON:", error);
                return (
                  <p className="text-sm text-red-600">
                    Failed to load description content
                  </p>
                );
              }
            })()
          ) : (
            <p className="text-sm text-muted-foreground">
              No description available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Social Links */}
      {(campaign.socialTwitter ||
        campaign.socialDiscord ||
        campaign.socialWebsite) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {campaign.socialTwitter && (
                <a
                  href={campaign.socialTwitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Twitter/X →
                </a>
              )}
              {campaign.socialDiscord && (
                <a
                  href={campaign.socialDiscord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Discord →
                </a>
              )}
              {campaign.socialWebsite && (
                <a
                  href={campaign.socialWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Website →
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Details</CardTitle>
          <CardDescription>Blockchain and storage information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Campaign ID</p>
            <p className="text-xs font-mono bg-gray-50 px-3 py-2 rounded break-all">
              {campaign.id}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Admin ID</p>
            <p className="text-xs font-mono bg-gray-50 px-3 py-2 rounded break-all">
              {campaign.adminId}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Subdomain</p>
            <p className="text-xs font-mono bg-gray-50 px-3 py-2 rounded break-all">
              {fullSubdomain}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Walrus Blob ID</p>
            <p className="text-xs font-mono bg-gray-50 px-3 py-2 rounded break-all">
              {campaign.walrusQuiltId || "Not available"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Storage Epochs</p>
            <p className="text-xs font-mono bg-gray-50 px-3 py-2 rounded">
              {campaign.walrusStorageEpochs}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Cover Image URL
            </p>
            <p className="text-xs font-mono bg-gray-50 px-3 py-2 rounded break-all">
              {campaign.coverImageUrl || "Not available"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Description URL
            </p>
            <p className="text-xs font-mono bg-gray-50 px-3 py-2 rounded break-all">
              {campaign.descriptionUrl || "Not available"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
