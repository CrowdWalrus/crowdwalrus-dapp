import { Link } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { ROUTES } from "@/shared/config/routes";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import { useEstimateStorageCost } from "@/features/campaigns/hooks/useCreateCampaign";
import { useWalrusUpload, type WalrusFlowState, type RegisterResult, type CertifyResult } from "@/features/campaigns/hooks/useWalrusUpload";
import { createCampaignTransaction } from "@/features/campaigns/helpers/createCampaignTransaction";
import { transformNewCampaignFormData } from "@/features/campaigns/utils/transformFormData";
import { extractCampaignIdFromEffects } from "@/services/campaign-transaction";
import { getContractConfig } from "@/shared/config/contracts";
import { getWalrusUrl } from "@/services/walrus";
import {
  WizardStep,
  type CreateCampaignResult,
  type CampaignFormData,
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
  description:
    "A revolutionary project to clean our oceans using AI-powered drones and sustainable practices.",
  subdomain: "ocean-cleanup-2025",
  coverImage: null as any,
  campaignType: "donation",
  categories: ["environment", "technology"],
  startDate: "2025-11-01",
  endDate: "2025-12-31",
  targetAmount: "50000",
  walletAddress:
    "0x4003168c48cb1ccb974723839b65f516d52ea646eee25f921617496e10df5761",
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
  const suiClient = useSuiClient();

  // Wizard state management
  const [wizardStep, setWizardStep] = useState<WizardStep>(WizardStep.FORM);
  const [formData, setFormData] = useState<CampaignFormData | null>(null);
  const [flowState, setFlowState] = useState<WalrusFlowState | null>(null);
  const [registerResult, setRegisterResult] = useState<RegisterResult | null>(null);
  const [uploadCompleted, setUploadCompleted] = useState(false);
  const [certifyResult, setCertifyResult] = useState<CertifyResult | null>(null);
  const [campaignResult, setCampaignResult] = useState<CreateCampaignResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Hooks for each step
  const { mutate: estimateCost, data: costEstimate, isPending: isEstimating } = useEstimateStorageCost();
  const walrus = useWalrusUpload();
  const { mutateAsync: signAndExecute, isPending: isExecuting } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showEffects: true,
          showObjectChanges: true,
          showRawEffects: true,
        },
      }),
  });

  const form = useForm<NewCampaignFormData>({
    resolver: zodResolver(newCampaignSchema),
    defaultValues: TEST_DEFAULTS, // Change to empty object {} when done testing
  });

  // Derive loading state
  const isPending = isEstimating || walrus.prepare.isPending || walrus.register.isPending ||
                    walrus.upload.isPending || walrus.certify.isPending || isExecuting;

  // Step 1: Form submission - validate and prepare data
  const onSubmit = (data: NewCampaignFormData) => {
    if (!currentAccount) {
      alert("Please connect your wallet first!");
      return;
    }

    if (!data.coverImage) {
      alert("Please select a cover image!");
      return;
    }

    const campaignFormData = transformNewCampaignFormData(data);
    setFormData(campaignFormData);
    setWizardStep(WizardStep.ESTIMATING);

    // Automatically estimate cost and prepare upload
    estimateCost(campaignFormData, {
      onSuccess: () => {
        // Prepare Walrus upload
        walrus.prepare.mutate(
          { formData: campaignFormData, network: DEFAULT_NETWORK },
          {
            onSuccess: (flow) => {
              setFlowState(flow);
              setWizardStep(WizardStep.CONFIRM_REGISTER);
            },
            onError: (err) => {
              setError(err);
              setWizardStep(WizardStep.ERROR);
            },
          }
        );
      },
      onError: (err) => {
        setError(err);
        setWizardStep(WizardStep.ERROR);
      },
    });
  };

  // Step 2: User confirms registration - buy Walrus storage
  const handleConfirmRegister = () => {
    if (!flowState) return;

    setWizardStep(WizardStep.REGISTERING);
    setError(null);

    walrus.register.mutate(flowState, {
      onSuccess: (result) => {
        setRegisterResult(result);
        setWizardStep(WizardStep.UPLOADING);

        // Automatically start upload after registration
        walrus.upload.mutate(
          { flowState: result.flowState, registerDigest: result.transactionDigest },
          {
            onSuccess: () => {
              setUploadCompleted(true);
              setWizardStep(WizardStep.CONFIRM_CERTIFY);
            },
            onError: (err) => {
              setError(err);
              setWizardStep(WizardStep.ERROR);
            },
          }
        );
      },
      onError: (err) => {
        setError(err);
        setWizardStep(WizardStep.ERROR);
      },
    });
  };

  // Retry upload (if it failed after registration was paid)
  const handleRetryUpload = () => {
    if (!registerResult) return;

    setWizardStep(WizardStep.UPLOADING);
    setError(null);

    walrus.upload.mutate(
      { flowState: registerResult.flowState, registerDigest: registerResult.transactionDigest },
      {
        onSuccess: () => {
          setUploadCompleted(true);
          setWizardStep(WizardStep.CONFIRM_CERTIFY);
        },
        onError: (err) => {
          setError(err);
          setWizardStep(WizardStep.ERROR);
        },
      }
    );
  };

  // Step 3: User confirms certification
  const handleConfirmCertify = () => {
    if (!registerResult) return;

    setWizardStep(WizardStep.CERTIFYING);
    setError(null);

    walrus.certify.mutate(registerResult.flowState, {
      onSuccess: (result) => {
        setCertifyResult(result);
        setWizardStep(WizardStep.CONFIRM_TX);
      },
      onError: (err) => {
        setError(err);
        setWizardStep(WizardStep.ERROR);
      },
    });
  };

  // Step 4: User confirms campaign creation transaction
  const handleConfirmTransaction = async () => {
    if (!formData || !certifyResult) return;

    setWizardStep(WizardStep.EXECUTING);
    setError(null);

    try {
      const transaction = createCampaignTransaction(
        formData,
        certifyResult.blobId,
        DEFAULT_NETWORK
      );

      const result = await signAndExecute({
        transaction,
        chain: `sui:${DEFAULT_NETWORK}`,
      });

      if (!result) {
        throw new Error("Transaction failed: No result returned");
      }

      // Extract campaign ID
      const config = getContractConfig(DEFAULT_NETWORK);
      const campaignId = extractCampaignIdFromEffects(result, config.contracts.packageId);

      if (!campaignId) {
        throw new Error("Failed to extract campaign ID from transaction effects");
      }

      // Build result with Walrus URLs
      const walrusDescriptionUrl = getWalrusUrl(certifyResult.blobId, DEFAULT_NETWORK, "description.html");
      const walrusCoverImageUrl = getWalrusUrl(certifyResult.blobId, DEFAULT_NETWORK, "cover.jpg");

      const finalResult: CreateCampaignResult = {
        campaignId,
        transactionDigest: result.digest,
        walrusBlobId: certifyResult.blobId,
        subdomain: formData.subdomain_name,
        walrusDescriptionUrl,
        walrusCoverImageUrl,
      };

      setCampaignResult(finalResult);
      setWizardStep(WizardStep.SUCCESS);

      console.log("=== CAMPAIGN CREATED SUCCESSFULLY ===");
      console.log("Campaign ID:", finalResult.campaignId);
      console.log("Transaction Digest:", finalResult.transactionDigest);
      console.log("=====================================");
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setWizardStep(WizardStep.ERROR);
    }
  };

  // Cancel/Reset handlers
  const handleCancelRegister = () => {
    setWizardStep(WizardStep.FORM);
  };

  const handleCancelCertify = () => {
    setWizardStep(WizardStep.CONFIRM_REGISTER);
  };

  const handleCancelTransaction = () => {
    setWizardStep(WizardStep.CONFIRM_CERTIFY);
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
                  {wizardStep !== WizardStep.FORM && (
                    <Alert className="border-blue-500">
                      <AlertDescription>
                        <p className="font-semibold">Wizard Step: {wizardStep}</p>
                        {isPending && (
                          <p className="text-sm text-muted-foreground">
                            Processing...
                          </p>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* TEST: Confirmation Buttons */}
                  {wizardStep === WizardStep.CONFIRM_REGISTER && (
                    <Alert className="border-green-500">
                      <AlertDescription>
                        <p className="font-semibold mb-4">Ready to Register Storage</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          This will cost WAL tokens to register storage on Walrus
                        </p>
                        <div className="flex gap-2">
                          <Button onClick={handleConfirmRegister} size="sm" disabled={isPending}>
                            {isPending ? "Processing..." : "Confirm Register"}
                          </Button>
                          <Button onClick={handleCancelRegister} size="sm" variant="outline" disabled={isPending}>
                            Cancel
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {wizardStep === WizardStep.CONFIRM_CERTIFY && (
                    <Alert className="border-green-500">
                      <AlertDescription>
                        <p className="font-semibold mb-4">Ready to Certify Blob</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Upload complete. Now certify the blob on blockchain.
                        </p>
                        <div className="flex gap-2">
                          <Button onClick={handleConfirmCertify} size="sm" disabled={isPending}>
                            {isPending ? "Processing..." : "Confirm Certify"}
                          </Button>
                          <Button onClick={handleCancelCertify} size="sm" variant="outline" disabled={isPending}>
                            Cancel
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {wizardStep === WizardStep.CONFIRM_TX && (
                    <Alert className="border-green-500">
                      <AlertDescription>
                        <p className="font-semibold mb-4">Ready to Create Campaign</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Files uploaded and certified. Create campaign on Sui blockchain.
                        </p>
                        <div className="flex gap-2">
                          <Button onClick={handleConfirmTransaction} size="sm" disabled={isPending}>
                            {isPending ? "Creating..." : "Create Campaign"}
                          </Button>
                          <Button onClick={handleCancelTransaction} size="sm" variant="outline" disabled={isPending}>
                            Cancel
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Error Display with Retry */}
                  {error && wizardStep === WizardStep.ERROR && (
                    <Alert className="border-red-500">
                      <AlertDescription>
                        <div className="flex items-center gap-2 mb-4">
                          <AlertCircleIcon className="size-4" />
                          <p className="text-red-600 font-semibold">
                            Error: {error.message}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setError(null);
                              // Determine which step to retry based on what data we have
                              if (certifyResult) {
                                // Error was during campaign creation
                                setWizardStep(WizardStep.CONFIRM_TX);
                              } else if (uploadCompleted) {
                                // Upload completed, error was during certification
                                setWizardStep(WizardStep.CONFIRM_CERTIFY);
                              } else if (registerResult) {
                                // Registration paid but upload failed - retry upload
                                handleRetryUpload();
                              } else if (flowState) {
                                // Error was during registration - retry registration
                                setWizardStep(WizardStep.CONFIRM_REGISTER);
                              } else {
                                // Error was during preparation, start over
                                setWizardStep(WizardStep.FORM);
                              }
                            }}
                            size="sm"
                          >
                            Try Again
                          </Button>
                          <Button
                            onClick={() => {
                              setError(null);
                              setWizardStep(WizardStep.FORM);
                              // Reset all state
                              setFormData(null);
                              setFlowState(null);
                              setRegisterResult(null);
                              setUploadCompleted(false);
                              setCertifyResult(null);
                            }}
                            size="sm"
                            variant="outline"
                          >
                            Start Over
                          </Button>
                        </div>
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
                    isCalculating={isEstimating}
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
                        disabled={isPending || !currentAccount || !certifyResult}
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
