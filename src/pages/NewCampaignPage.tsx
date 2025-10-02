import { Link } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { ROUTES } from "@/shared/config/routes";
import { useCurrentAccount } from "@mysten/dapp-kit";
import {
  useCreateCampaign,
  useEstimateStorageCost,
} from "@/features/campaigns/hooks/useCreateCampaign";
import { transformNewCampaignFormData } from "@/features/campaigns/utils/transformFormData";
import type {
  CampaignCreationProgress,
  CreateCampaignResult,
} from "@/features/campaigns/types/campaign";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/shared/components/ui/breadcrumb";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Separator } from "@/shared/components/ui/separator";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import {
  CampaignCoverImageUpload,
  CampaignTypeSelector,
  CampaignCategorySelector,
  CampaignTimeline,
  CampaignFundingTargetSection,
  CampaignSocialsSection,
  CampaignDetailsEditor,
  CampaignStorageRegistrationCard,
  CampaignTermsAndConditionsSection,
  type StorageCost,
} from "@/features/campaigns/components/new-campaign";
import {
  newCampaignSchema,
  type NewCampaignFormData,
} from "@/features/campaigns/schemas/newCampaignSchema";
import { AlertCircleIcon } from "lucide-react";

// ============================================================================
// TEST DEFAULT VALUES - Remove this block after testing
// ============================================================================
const TEST_DEFAULTS = {
  campaignName: "Test Campaign for Ocean Cleanup",
  description: "A revolutionary project to clean our oceans using AI-powered drones and sustainable practices.",
  subdomain: "ocean-cleanup-2025",
  coverImage: null as any,
  campaignType: "donation",
  categories: ["environment", "technology"],
  startDate: "2025-11-01",
  endDate: "2025-12-31",
  targetAmount: "50000",
  walletAddress: "",
  socials: [
    { platform: "website", url: "https://example.com" },
    { platform: "twitter", url: "https://twitter.com/oceancleanup" },
    { platform: "instagram", url: "https://instagram.com/oceancleanup" },
  ],
  campaignDetails: "", // Leave empty - fill manually in the rich text editor
  termsAccepted: false,
};
// ============================================================================

export default function NewCampaignPage() {
  const currentAccount = useCurrentAccount();
  const {
    mutate: createCampaign,
    isPending,
    currentStep,
    error,
  } = useCreateCampaign();
  const { mutate: estimateCost, data: costEstimate } = useEstimateStorageCost();
  const [progressMessage, setProgressMessage] = useState("");
  const [campaignResult, setCampaignResult] =
    useState<CreateCampaignResult | null>(null);

  const form = useForm<NewCampaignFormData>({
    resolver: zodResolver(newCampaignSchema),
    defaultValues: TEST_DEFAULTS, // Change to empty object {} when done testing
  });

  const onSubmit = (data: NewCampaignFormData) => {
    console.log("Form submitted:", data);

    if (!currentAccount) {
      alert("Please connect your wallet first!");
      return;
    }

    if (!data.coverImage) {
      alert("Please select a cover image!");
      return;
    }

    // Transform form data to campaign format
    const campaignFormData = transformNewCampaignFormData(data);

    console.log("=== CAMPAIGN CREATION START ===");
    console.log("Connected Wallet:", currentAccount.address);
    console.log("Network:", "testnet");
    console.log("\n--- Form Data ---");
    console.log("Name:", campaignFormData.name);
    console.log("Short Description:", campaignFormData.short_description);
    console.log("Subdomain:", campaignFormData.subdomain_name);
    console.log("Category:", campaignFormData.category);
    console.log("Funding Goal:", campaignFormData.funding_goal, "SUI");
    console.log("Start Date:", campaignFormData.start_date.toISOString());
    console.log("End Date:", campaignFormData.end_date.toISOString());
    console.log("Cover Image:", {
      name: campaignFormData.cover_image.name,
      size: campaignFormData.cover_image.size,
      type: campaignFormData.cover_image.type,
    });
    console.log(
      "Social Twitter:",
      campaignFormData.social_twitter || "Not provided",
    );
    console.log(
      "Social Discord:",
      campaignFormData.social_discord || "Not provided",
    );
    console.log(
      "Social Website:",
      campaignFormData.social_website || "Not provided",
    );
    console.log("================================\n");

    createCampaign(
      {
        formData: campaignFormData,
        options: {
          network: "testnet",
          onProgress: (progress: CampaignCreationProgress) => {
            console.log(`[Progress] ${progress.step}: ${progress.message}`);
            setProgressMessage(progress.message);
          },
        },
      },
      {
        onSuccess: (result) => {
          console.log("\n=== CAMPAIGN CREATED SUCCESSFULLY ===");
          console.log("Campaign ID:", result.campaignId);
          console.log("Transaction Digest:", result.transactionDigest);
          console.log("Walrus Blob ID:", result.walrusBlobId);
          console.log("Subdomain:", result.subdomain);
          console.log("Description URL:", result.walrusDescriptionUrl);
          console.log("Cover Image URL:", result.walrusCoverImageUrl);
          console.log("=====================================\n");
          setCampaignResult(result);
        },
        onError: (error) => {
          console.error("\n=== CAMPAIGN CREATION FAILED ===");
          console.error("Error:", error);
          console.error("================================\n");
        },
      },
    );
  };

  // Function to estimate storage costs
  const handleEstimateCost = () => {
    const formValues = form.getValues();

    // Only estimate if we have required data
    if (!formValues.coverImage || !formValues.campaignDetails) {
      alert("Please upload a cover image and add campaign details first");
      return;
    }

    try {
      const campaignFormData = transformNewCampaignFormData(formValues);
      estimateCost(campaignFormData);
    } catch (error) {
      console.error("Error estimating cost:", error);
    }
  };

  const storageCosts: StorageCost[] = costEstimate
    ? [
        {
          label: "HTML content",
          amount: `${(costEstimate.breakdown.htmlSize / 1024).toFixed(2)} KB`,
        },
        {
          label: "Cover image",
          amount: `${(costEstimate.breakdown.imagesSize / 1024 / 1024).toFixed(2)} MB`,
        },
        {
          label: "Encoded size (with redundancy)",
          amount: `${(costEstimate.encodedSize / 1024 / 1024).toFixed(2)} MB`,
        },
        {
          label: `Storage (${costEstimate.epochs} epochs)`,
          amount: `${costEstimate.subsidizedStorageCost.toFixed(6)} WAL`,
        },
        {
          label: "Upload cost",
          amount: `${costEstimate.subsidizedUploadCost.toFixed(6)} WAL`,
        },
        ...(costEstimate.subsidyRate && costEstimate.subsidyRate > 0
          ? [
              {
                label: `Subsidy discount (${(costEstimate.subsidyRate * 100).toFixed(0)}%)`,
                amount: `-${(costEstimate.totalCostWal - costEstimate.subsidizedTotalCost).toFixed(6)} WAL`,
              },
            ]
          : []),
      ]
    : [
        { label: "Campaign metadata", amount: "Calculate first" },
        { label: "Cover image", amount: "Calculate first" },
        { label: "Campaign description", amount: "Calculate first" },
        { label: "Storage epoch", amount: "Calculate first" },
      ];

  const totalCost = costEstimate
    ? `${costEstimate.subsidizedTotalCost.toFixed(6)} WAL`
    : "Calculate first";

  return (
    <FormProvider {...form}>
      <div className="py-8">
        <div className="container">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={ROUTES.HOME}>Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Launch Campaign</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="container flex justify-center">
          <div className="w-full max-w-3xl px-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                {/* Page Header */}
                <div className="flex flex-col gap-16">
                  {/* Wallet Status */}
                  {!currentAccount && (
                    <Alert className="border-yellow-500">
                      <AlertDescription className="flex items-center gap-2">
                        <AlertCircleIcon className="size-4" />
                        Please connect your wallet to create a campaign
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Progress Display */}
                  {isPending && (
                    <Alert className="border-blue-500">
                      <AlertDescription>
                        <p className="font-semibold">Status: {currentStep}</p>
                        <p className="text-sm text-muted-foreground">
                          {progressMessage}
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Error Display */}
                  {error && (
                    <Alert className="border-red-500">
                      <AlertDescription className="flex items-center gap-2">
                        <AlertCircleIcon className="size-4" />
                        <p className="text-red-600 font-semibold">
                          Error: {error.message}
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Success Display */}
                  {campaignResult && (
                    <Alert className="border-green-500">
                      <AlertDescription>
                        <p className="text-green-600 font-semibold mb-4">
                          Campaign Created Successfully!
                        </p>
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Campaign ID:</strong>{" "}
                            {campaignResult.campaignId}
                          </p>
                          <p>
                            <strong>Subdomain:</strong>{" "}
                            {campaignResult.subdomain}
                          </p>
                          <p>
                            <strong>Transaction:</strong>{" "}
                            {campaignResult.transactionDigest}
                          </p>
                          <p>
                            <strong>Walrus Blob ID:</strong>{" "}
                            {campaignResult.walrusBlobId}
                          </p>
                          <p>
                            <strong>Description URL:</strong>{" "}
                            {campaignResult.walrusDescriptionUrl}
                          </p>
                          <p>
                            <strong>Cover Image URL:</strong>{" "}
                            {campaignResult.walrusCoverImageUrl}
                          </p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col items-center text-center gap-4 mb-16">
                    <h1 className="text-4xl font-bold mb-4">Launch Campaign</h1>
                    <p className="text-muted-foreground text-base">
                      Enter your campaign details. You can edit campaign details
                      anytime after your publish your campaign, but the
                      transaction will cost gas.
                    </p>
                  </div>

                  {/* Campaign Details Section */}
                  <section className="flex flex-col mb-12 gap-8">
                    <h2 className="text-2xl font-semibold mb-8">
                      Campaign Details
                    </h2>

                    <div className="flex flex-col gap-8">
                      {/* Campaign Name */}
                      <FormField
                        control={form.control}
                        name="campaignName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Title <span className="text-red-300">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your campaign name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Description */}
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Short description{" "}
                              <span className="text-red-300">*</span>
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Brief description of your campaign"
                                rows={4}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Subdomain */}
                      <FormField
                        control={form.control}
                        name="subdomain"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Sub-name <span className="text-red-300">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="yourcampaign" {...field} />
                            </FormControl>
                            <p className="text-sm text-muted-foreground pt-2">
                              yourcampaign.crowdwalrus.site
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Cover Image */}
                      <CampaignCoverImageUpload />
                    </div>
                  </section>

                  <Separator />

                  {/* Campaign Type Section */}
                  <CampaignTypeSelector />

                  {/* Select Category Section */}
                  <CampaignCategorySelector />

                  <Separator />

                  {/* Campaign Timeline Section */}
                  <CampaignTimeline />

                  {/* Funding Target Section */}
                  <CampaignFundingTargetSection />

                  <Separator />

                  {/* Additional Details Section */}
                  <section className="flex flex-col gap-8 mb-12">
                    <h2 className="text-2xl font-semibold">
                      Additional Details
                    </h2>

                    {/* Add Socials */}
                    <CampaignSocialsSection />

                    {/* Rich Text Editor */}
                    <CampaignDetailsEditor />
                  </section>

                  <Separator />

                  {/* Terms and Conditions Section */}
                  <CampaignTermsAndConditionsSection />

                  {/* Storage Registration Section */}
                  <CampaignStorageRegistrationCard
                    costs={storageCosts}
                    totalCost={totalCost}
                    onCalculate={handleEstimateCost}
                    isCalculating={false}
                    walBalance="N/A (WAL coin type not configured)"
                    hasInsufficientBalance={false}
                  />

                  <Separator />

                  {/* Final Submit Section */}
                  <section className="flex flex-col gap-6">
                    <Alert className="mb-6">
                      <AlertDescription className="flex items-center gap-2">
                        <span className="flex items-center gap-2">
                          <AlertCircleIcon className="size-4" />
                          You can publish campaign after completing the
                          "Register Storage" step
                        </span>
                      </AlertDescription>
                    </Alert>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        size="lg"
                        className="min-w-[168px]"
                        disabled={isPending || !currentAccount}
                      >
                        {isPending ? "Creating..." : "Register Campaign"}
                      </Button>
                    </div>
                  </section>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
