import { Link } from "react-router-dom";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useWalBalance } from "@/shared/hooks/useWalBalance";
import { ROUTES } from "@/shared/config/routes";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import {
  DEFAULT_NETWORK,
  WALRUS_EPOCH_CONFIG,
} from "@/shared/config/networkConfig";
import { useEstimateStorageCost } from "@/features/campaigns/hooks/useCreateCampaign";
import {
  useWalrusUpload,
  type WalrusFlowState,
  type RegisterResult,
  type CertifyResult,
} from "@/features/campaigns/hooks/useWalrusUpload";
import { createCampaignTransaction } from "@/features/campaigns/helpers/createCampaignTransaction";
import { transformNewCampaignFormData } from "@/features/campaigns/utils/transformFormData";
import { extractCampaignIdFromEffects } from "@/services/campaign-transaction";
import { getContractConfig } from "@/shared/config/contracts";
import { getWalrusUrl } from "@/services/walrus";
import { useSubnameAvailability } from "@/features/campaigns/hooks/useSubnameAvailability";
import { formatSubdomain, SUBDOMAIN_PATTERN } from "@/shared/utils/subdomain";
import { cn } from "@/shared/lib/utils";
import {
  WizardStep,
  type CreateCampaignResult,
  type CampaignFormData,
} from "@/features/campaigns/types/campaign";
import {
  CampaignCreationModal,
  useCampaignCreationModal,
} from "@/features/campaigns/components/campaign-creation-modal";
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
import { isUserRejectedError } from "@/shared/utils/errors";

// ============================================================================
// TEST DEFAULT VALUES - Remove this block after testing
// ============================================================================
const TEST_DEFAULTS: Partial<NewCampaignFormData> = {
  campaignName: "Test Campaign for Ocean Cleanup",
  description:
    "A revolutionary project to clean our oceans using AI-powered drones and sustainable practices.",
  subdomain: "ocean-cleanup-2025",
  coverImage: undefined,
  campaignType: "donation",
  categories: ["environment", "tech"],
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

const AUTO_CALCULATING_LABEL = "Calculating...";

export default function NewCampaignPage() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  // WAL balance hook
  const {
    formattedBalance,
    isLoading: isLoadingBalance,
    balance: walBalanceRaw,
  } = useWalBalance();

  // Modal state management
  const modal = useCampaignCreationModal();
  const { openModal, closeModal } = modal;

  // Wizard state management
  // TODO: TEMP - Change back to WizardStep.FORM after UI work
  const [wizardStep, setWizardStep] = useState<WizardStep>(WizardStep.FORM);
  const [formData, setFormData] = useState<CampaignFormData | null>(null);
  const [flowState, setFlowState] = useState<WalrusFlowState | null>(null);
  const [registerResult, setRegisterResult] = useState<RegisterResult | null>(
    null,
  );
  const [uploadCompleted, setUploadCompleted] = useState(false);
  const [certifyResult, setCertifyResult] = useState<CertifyResult | null>(
    null,
  );
  const [certifyRejectionMessage, setCertifyRejectionMessage] = useState<
    string | null
  >(null);
  const [campaignResult, setCampaignResult] =
    useState<CreateCampaignResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Storage epochs state
  const [selectedEpochs, setSelectedEpochs] = useState<number>(
    WALRUS_EPOCH_CONFIG[DEFAULT_NETWORK].defaultEpochs,
  );

  // Handler with epoch clamping validation
  const handleEpochsChange = (epochs: number) => {
    const config = WALRUS_EPOCH_CONFIG[DEFAULT_NETWORK];
    const clampedEpochs = Math.min(Math.max(1, epochs), config.maxEpochs);
    setSelectedEpochs(clampedEpochs);
  };

  // Hooks for each step
  const {
    mutate: estimateCost,
    data: costEstimate,
    isPending: isEstimating,
  } = useEstimateStorageCost();
  const walrus = useWalrusUpload();
  const { mutateAsync: signAndExecute, isPending: isExecuting } =
    useSignAndExecuteTransaction({
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
    mode: "onChange", // Revalidate on every change after first validation
    defaultValues: TEST_DEFAULTS, // Change to empty object {} when done testing
  });

  const subdomainValue = useWatch({ control: form.control, name: "subdomain" });
  const rawSubdomain = (subdomainValue ?? "").trim();
  const debouncedSubdomain = useDebounce(rawSubdomain, 400);
  const hasRawSubdomain = rawSubdomain.length > 0;
  const hasDebouncedSubdomain = debouncedSubdomain.length > 0;
  const isSubdomainPatternValid =
    hasDebouncedSubdomain && SUBDOMAIN_PATTERN.test(debouncedSubdomain);

  const {
    status: subnameStatus,
    fullName: resolvedSubdomainFull,
    campaignDomain,
    isChecking: isCheckingSubname,
    error: subnameError,
  } = useSubnameAvailability(
    isSubdomainPatternValid ? debouncedSubdomain : null,
  );
  const availabilityErrorMessage = subnameError?.message ?? "";

  const debouncedFullSubdomain =
    campaignDomain && hasDebouncedSubdomain
      ? formatSubdomain(debouncedSubdomain, campaignDomain)
      : "";

  const availabilityFullSubdomain =
    resolvedSubdomainFull || debouncedFullSubdomain;

  const rawFullSubdomain =
    campaignDomain && hasRawSubdomain && SUBDOMAIN_PATTERN.test(rawSubdomain)
      ? formatSubdomain(rawSubdomain, campaignDomain)
      : "";

  const previewFullSubdomain =
    availabilityFullSubdomain ||
    debouncedFullSubdomain ||
    rawFullSubdomain ||
    (campaignDomain ? `yourcampaign.${campaignDomain}` : "");

  const availabilityDisplayName =
    availabilityFullSubdomain ||
    debouncedFullSubdomain ||
    rawFullSubdomain ||
    rawSubdomain ||
    "this sub-name";

  const includesCampaignSuffix =
    !!campaignDomain && rawSubdomain.endsWith(`.${campaignDomain}`);
  const containsDot = rawSubdomain.includes(".");

  const subdomainFieldState = form.getFieldState("subdomain");
  const fieldErrorMessage =
    (subdomainFieldState.error?.message as string | undefined) ?? "";
  const isManualFieldError = subdomainFieldState.error?.type === "manual";

  useEffect(() => {
    const isManualError = isManualFieldError;

    if (!isSubdomainPatternValid) {
      if (isManualError) {
        form.clearErrors("subdomain");
      }
      return;
    }

    if (subnameStatus === "checking") {
      if (isManualError) {
        form.clearErrors("subdomain");
      }
      return;
    }

    if (subnameStatus === "taken") {
      const message = `${availabilityDisplayName} is already registered. Please choose another sub-name.`;
      if (fieldErrorMessage !== message) {
        form.setError("subdomain", { type: "manual", message });
      }
      return;
    }

    if (subnameStatus === "error") {
      const message = `We couldn't verify this sub-name right now. Please try again${availabilityErrorMessage ? ` (${availabilityErrorMessage})` : ""}.`;
      if (fieldErrorMessage !== message) {
        form.setError("subdomain", { type: "manual", message });
      }
      return;
    }

    if (isManualError) {
      form.clearErrors("subdomain");
    }
  }, [
    form,
    isSubdomainPatternValid,
    subnameStatus,
    availabilityDisplayName,
    availabilityErrorMessage,
    fieldErrorMessage,
    isManualFieldError,
  ]);

  const helperVariant =
    !campaignDomain || !hasRawSubdomain
      ? "default"
      : includesCampaignSuffix ||
          (containsDot && !includesCampaignSuffix) ||
          subnameStatus === "taken" ||
          subnameStatus === "error"
        ? "error"
        : subnameStatus === "available"
          ? "success"
          : "default";

  const subdomainHelperClass = cn(
    "text-sm pt-2",
    helperVariant === "error"
      ? "text-destructive"
      : helperVariant === "success"
        ? "text-emerald-500"
        : "text-muted-foreground",
  );

  const subdomainHelperText = (() => {
    if (fieldErrorMessage) {
      return "";
    }

    if (!campaignDomain) {
      return "Loading network configuration…";
    }

    if (!hasRawSubdomain) {
      return `Your campaign URL will look like yourcampaign.${campaignDomain}`;
    }

    if (includesCampaignSuffix) {
      return `You only need the part before .${campaignDomain}. We'll add it automatically.`;
    }

    if (containsDot && !includesCampaignSuffix) {
      return "Skip the domain suffix; just choose a unique label.";
    }

    if (isCheckingSubname) {
      return `Checking availability for ${availabilityDisplayName}…`;
    }

    if (subnameStatus === "taken") {
      return `${availabilityDisplayName} is already registered.`;
    }

    if (subnameStatus === "available") {
      return `${availabilityDisplayName} is available.`;
    }

    if (subnameStatus === "error") {
      return `We couldn't verify availability for ${availabilityDisplayName}. Please try again${availabilityErrorMessage ? ` (${availabilityErrorMessage})` : ""}.`;
    }

    return `Your campaign URL will be ${previewFullSubdomain}.`;
  })();

  const shouldShowHelperText = subdomainHelperText.length > 0;

  // Watch form values for auto-estimation
  const coverImage = useWatch({ control: form.control, name: "coverImage" });
  const campaignDetails = useWatch({
    control: form.control,
    name: "campaignDetails",
  });

  // Debounce the watched values (3 seconds)
  const debouncedCoverImage = useDebounce(coverImage, 1000);
  const debouncedCampaignDetails = useDebounce(campaignDetails, 1000);

  // Auto-estimate cost when debounced values or epochs change
  useEffect(() => {
    // Only estimate if we have both required fields
    if (!debouncedCoverImage || !debouncedCampaignDetails) {
      return;
    }

    try {
      const formValues = form.getValues();
      const campaignFormData = transformNewCampaignFormData(formValues);
      estimateCost({ formData: campaignFormData, epochs: selectedEpochs });
    } catch (error) {
      console.error("Error auto-estimating cost:", error);
    }
  }, [
    debouncedCoverImage,
    debouncedCampaignDetails,
    estimateCost,
    form,
    selectedEpochs,
  ]);

  // Derive loading states
  // For registration flow (actual registration operations)
  const isRegistrationPending =
    walrus.register.isPending ||
    walrus.upload.isPending ||
    walrus.certify.isPending ||
    isExecuting;

  // For all operations (includes everything)
  const hasCompletedStorageRegistration = certifyResult !== null;
  const isFormLocked =
    hasCompletedStorageRegistration ||
    wizardStep === WizardStep.REGISTERING ||
    wizardStep === WizardStep.UPLOADING ||
    wizardStep === WizardStep.CERTIFYING ||
    wizardStep === WizardStep.CONFIRM_TX ||
    wizardStep === WizardStep.EXECUTING ||
    wizardStep === WizardStep.SUCCESS;

  const rawErrorMessage = error?.message ?? "";
  const isUploadError =
    !!error &&
    (rawErrorMessage.toLowerCase().includes("failed to upload") ||
      (registerResult && !uploadCompleted && !certifyResult));

  const errorHeading = (() => {
    if (!error) {
      return "";
    }
    if (isUploadError) {
      return "Upload failed";
    }
    return rawErrorMessage || "Something went wrong";
  })();

  const errorBody = (() => {
    if (!error) {
      return "";
    }

    if (isUploadError) {
      const lines = rawErrorMessage
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length > 0 && lines[0].toLowerCase().includes("sign failed")) {
        lines.shift();
      }

      const cleanedMessage = lines.join("\n");
      return cleanedMessage.length > 0 ? cleanedMessage : rawErrorMessage;
    }

    if (!rawErrorMessage) {
      return "";
    }

    if (
      errorHeading.trim().toLowerCase() === rawErrorMessage.trim().toLowerCase()
    ) {
      return "";
    }

    return rawErrorMessage;
  })();

  // Sync wizard step with modal - open modal for active flow steps only
  useEffect(() => {
    if (
      wizardStep !== WizardStep.FORM &&
      wizardStep !== WizardStep.CONFIRM_TX
    ) {
      openModal(wizardStep);
    } else {
      closeModal();
    }
  }, [wizardStep, closeModal, openModal]);

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
    // Don't open modal yet - let estimation and preparation happen silently

    // Automatically estimate cost and prepare upload
    estimateCost(
      { formData: campaignFormData, epochs: selectedEpochs },
      {
        onSuccess: () => {
          // Prepare Walrus upload
          walrus.prepare.mutate(
            {
              formData: campaignFormData,
              network: DEFAULT_NETWORK,
              storageEpochs: selectedEpochs,
            },
            {
              onSuccess: (flow) => {
                setFlowState(flow);
                // Only now open the modal with the confirm register step
                setWizardStep(WizardStep.CONFIRM_REGISTER);
              },
              onError: (err) => {
                setError(err);
                setWizardStep(WizardStep.ERROR);
              },
            },
          );
        },
        onError: (err) => {
          setError(err);
          setWizardStep(WizardStep.ERROR);
        },
      },
    );
  };

  // Handler for Register Storage button - validates form first
  const handleRegisterStorageClick = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      const data = form.getValues();
      onSubmit(data);
    }
  };

  // Step 2: User confirms registration - buy Walrus storage
  const handleConfirmRegister = () => {
    if (!flowState) return;

    setWizardStep(WizardStep.REGISTERING);
    setError(null);
    setCertifyRejectionMessage(null);

    walrus.register.mutate(flowState, {
      onSuccess: (result) => {
        setRegisterResult(result);
        setWizardStep(WizardStep.UPLOADING);

        // Automatically start upload after registration
        walrus.upload.mutate(
          {
            flowState: result.flowState,
            registerDigest: result.transactionDigest,
          },
          {
            onSuccess: () => {
              setUploadCompleted(true);
              startCertifyFlow(result.flowState);
            },
            onError: (err) => {
              setError(err);
              setWizardStep(WizardStep.ERROR);
            },
          },
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
    setCertifyRejectionMessage(null);

    walrus.upload.mutate(
      {
        flowState: registerResult.flowState,
        registerDigest: registerResult.transactionDigest,
      },
      {
        onSuccess: () => {
          setUploadCompleted(true);
          startCertifyFlow(registerResult.flowState);
        },
        onError: (err) => {
          setError(err);
          setWizardStep(WizardStep.ERROR);
        },
      },
    );
  };

  const startCertifyFlow = (flowState: WalrusFlowState | null) => {
    if (!flowState || walrus.certify.isPending) {
      return;
    }

    setWizardStep(WizardStep.CERTIFYING);
    setError(null);
    setCertifyRejectionMessage(null);

    walrus.certify.mutate(flowState, {
      onSuccess: (result) => {
        setCertifyResult(result);
        setWizardStep(WizardStep.CONFIRM_TX);
        closeModal();
      },
      onError: (err) => {
        if (isUserRejectedError(err)) {
          setCertifyRejectionMessage(
            "Approve the certification transaction in your wallet to continue.",
          );
          setWizardStep(WizardStep.FORM);
          return;
        }

        setError(err instanceof Error ? err : new Error("Unknown error"));
        setWizardStep(WizardStep.ERROR);
      },
    });
  };

  const handleRetryCertify = () => {
    if (!registerResult) return;

    startCertifyFlow(registerResult.flowState);
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
        DEFAULT_NETWORK,
        certifyResult.storageEpochs,
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
      const campaignId = extractCampaignIdFromEffects(
        result,
        config.contracts.packageId,
      );

      if (!campaignId) {
        throw new Error(
          "Failed to extract campaign ID from transaction effects",
        );
      }

      // Build result with Walrus URLs
      const walrusDescriptionUrl = getWalrusUrl(
        certifyResult.blobId,
        DEFAULT_NETWORK,
        "description.json",
      );
      const walrusCoverImageUrl = getWalrusUrl(
        certifyResult.blobId,
        DEFAULT_NETWORK,
        "cover.jpg",
      );

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
    setCertifyRejectionMessage(null);
  };

  const handleCancelTransaction = () => {
    setWizardStep(WizardStep.FORM);
    setCertifyRejectionMessage(null);
  };

  const storageCosts: StorageCost[] = costEstimate
    ? [
        {
          label: "JSON content",
          amount: `${(costEstimate.breakdown.jsonSize / 1024).toFixed(2)} KB`,
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
        { label: "Campaign metadata", amount: AUTO_CALCULATING_LABEL },
        { label: "Cover image", amount: AUTO_CALCULATING_LABEL },
        { label: "Campaign description", amount: AUTO_CALCULATING_LABEL },
        { label: "Storage epoch", amount: AUTO_CALCULATING_LABEL },
      ];

  const totalCost = costEstimate
    ? `${costEstimate.subsidizedTotalCost.toFixed(6)} WAL`
    : AUTO_CALCULATING_LABEL;

  // Unified retry handler for the modal
  const handleRetry = () => {
    setError(null);
    // Determine which step to retry based on what data we have
    if (certifyResult) {
      // Error was during campaign creation
      setWizardStep(WizardStep.CONFIRM_TX);
    } else if (uploadCompleted && registerResult) {
      // Upload completed, error was during certification
      startCertifyFlow(registerResult.flowState);
    } else if (uploadCompleted) {
      setWizardStep(WizardStep.CONFIRM_REGISTER);
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
  };

  // Close modal handler
  const handleCloseModal = () => {
    if (wizardStep === WizardStep.SUCCESS) {
      closeModal();
      setWizardStep(WizardStep.FORM);
      setCertifyRejectionMessage(null);
      return;
    }

    if (wizardStep === WizardStep.ERROR) {
      closeModal();
      setWizardStep(WizardStep.FORM);
      setError(null);

      if (!certifyResult) {
        setFormData(null);
        setFlowState(null);
        setRegisterResult(null);
        setUploadCompleted(false);
      }

      setCertifyRejectionMessage(null);
    }
  };

  return (
    <FormProvider {...form}>
      {/* Campaign Creation Modal */}
      <CampaignCreationModal
        isOpen={modal.isOpen}
        currentStep={modal.currentStep}
        onClose={handleCloseModal}
        onConfirmRegister={handleConfirmRegister}
        onCancelRegister={handleCancelRegister}
        onConfirmTransaction={handleConfirmTransaction}
        onCancelTransaction={handleCancelTransaction}
        onRetry={handleRetry}
        estimatedCost={costEstimate}
        uploadProgress={0} // TODO: Add real upload progress tracking
        campaignResult={campaignResult}
        errorTitle={errorHeading || undefined}
        error={errorBody || rawErrorMessage || undefined}
      />

      <div className="py-8">
        <div className="container px-4">
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

        <div className="container px-4 flex justify-center">
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

                  <fieldset
                    disabled={isFormLocked}
                    className="flex flex-col gap-16"
                  >
                    <div className="flex flex-col items-center text-center gap-4 mb-16">
                      <h1 className="text-4xl font-bold mb-4">
                        Launch Campaign
                      </h1>
                      <p className="text-muted-foreground text-base">
                        Enter your campaign details. You can edit campaign
                        details anytime after your publish your campaign, but
                        the transaction will cost gas.
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
                            <FormItem className="flex flex-col gap-4">
                              <FormLabel className="font-medium text-base">
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
                            <FormItem className="flex flex-col gap-4">
                              <FormLabel className="font-medium text-base">
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
                            <FormItem className="flex flex-col gap-4">
                              <FormLabel className="font-medium text-base">
                                Sub-name <span className="text-red-300">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="yourcampaign" {...field} />
                              </FormControl>
                              {shouldShowHelperText ? (
                                <p className={subdomainHelperClass}>
                                  {subdomainHelperText}
                                </p>
                              ) : null}
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Cover Image */}
                        <CampaignCoverImageUpload disabled={isFormLocked} />
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
                      <CampaignDetailsEditor disabled={isFormLocked} />
                    </section>

                    <Separator />

                    {/* Terms and Conditions Section */}
                    <CampaignTermsAndConditionsSection />
                  </fieldset>

                  {/* Storage Registration Section */}
                  <CampaignStorageRegistrationCard
                    costs={storageCosts}
                    totalCost={totalCost}
                    isCalculating={isEstimating}
                    onRegister={handleRegisterStorageClick}
                    isPreparing={walrus.prepare.isPending}
                    walBalance={
                      isLoadingBalance ? "Loading..." : formattedBalance
                    }
                    hasInsufficientBalance={
                      costEstimate && !isLoadingBalance
                        ? BigInt(
                            Math.floor(
                              costEstimate.subsidizedTotalCost * 10 ** 9,
                            ),
                          ) > BigInt(walBalanceRaw)
                        : false
                    }
                    requiredWalAmount={costEstimate?.subsidizedTotalCost}
                    selectedEpochs={selectedEpochs}
                    onEpochsChange={handleEpochsChange}
                    certifyErrorMessage={certifyRejectionMessage}
                    onRetryCertify={handleRetryCertify}
                    isRetryingCertify={walrus.certify.isPending}
                    isLocked={isFormLocked}
                    storageRegistered={hasCompletedStorageRegistration}
                    estimatedCost={costEstimate}
                    hideRegisterButton={
                      Boolean(certifyRejectionMessage) ||
                      hasCompletedStorageRegistration
                    }
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
                        type="button"
                        size="lg"
                        className="min-w-[168px]"
                        onClick={handleConfirmTransaction}
                        disabled={
                          isRegistrationPending ||
                          !currentAccount ||
                          !certifyResult
                        }
                      >
                        {isExecuting ? "Creating..." : "Publish Campaign"}
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
