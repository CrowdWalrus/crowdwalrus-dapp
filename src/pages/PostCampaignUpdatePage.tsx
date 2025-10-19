import { useMemo, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, addMonths, differenceInCalendarDays, format } from "date-fns";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { AlertCircleIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { Form } from "@/shared/components/ui/form";
import {
  CampaignCreationModal,
  useCampaignCreationModal,
} from "@/features/campaigns/components/campaign-creation-modal";
import {
  CampaignStorageRegistrationCard,
  type StorageCost,
} from "@/features/campaigns/components/new-campaign";
import { CampaignUpdateEditor } from "@/features/campaigns/components/campaign-updates";
import {
  campaignUpdateSchema,
  type CampaignUpdateFormData,
} from "@/features/campaigns/schemas/campaignUpdateSchema";
import { useCampaign } from "@/features/campaigns/hooks/useCampaign";
import { useResolvedCampaignId } from "@/features/campaigns/hooks/useResolvedCampaignId";
import {
  useWalrusUpload,
  type WalrusFlowState,
  type RegisterResult,
  type CertifyResult,
} from "@/features/campaigns/hooks/useWalrusUpload";
import { useEstimateUpdateStorageCost } from "@/features/campaigns/hooks/useCampaignUpdateStorage";
import { useOwnedCampaignCap } from "@/features/campaigns/hooks/useOwnedCampaignCap";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useWalBalance } from "@/shared/hooks/useWalBalance";
import { ROUTES } from "@/shared/config/routes";
import { getContractConfig } from "@/shared/config/contracts";
import {
  DEFAULT_NETWORK,
  WALRUS_EPOCH_CONFIG,
} from "@/shared/config/networkConfig";
import { WizardStep } from "@/features/campaigns/types/campaign";
import type {
  CampaignUpdateStorageData,
  CampaignUpdateResult,
} from "@/features/campaigns/types/campaignUpdate";
import {
  buildAddUpdateTransaction,
  extractCampaignUpdateIdFromEffects,
} from "@/services/campaign-transaction";
import { getWalrusUrl } from "@/services/walrus";
import { lexicalToPlainText } from "@/shared/utils/lexical";
import { isUserRejectedError } from "@/shared/utils/errors";
import { buildCampaignDetailPath } from "@/shared/utils/routes";
import {
  CampaignResolutionError,
  CampaignResolutionLoading,
  CampaignResolutionMissing,
  CampaignResolutionNotFound,
} from "@/features/campaigns/components/CampaignResolutionStates";

const DEFAULT_FORM_VALUES: CampaignUpdateFormData = {
  updateContent: "",
};

export default function PostCampaignUpdatePage() {
  const { id: campaignIdParam } = useParams<{ id: string }>();
  const rawIdentifier = campaignIdParam ?? "";
  const {
    campaignId: resolvedCampaignId,
    isLoading: isResolvingIdentifier,
    notFound: isIdentifierNotFound,
    error: identifierError,
  } = useResolvedCampaignId(rawIdentifier);
  const campaignId = resolvedCampaignId ?? "";
  const modal = useCampaignCreationModal();
  const { openModal, closeModal } = modal;
  const [wizardStep, setWizardStep] = useState<WizardStep>(WizardStep.FORM);
  const network = DEFAULT_NETWORK;
  const epochConfig = WALRUS_EPOCH_CONFIG[network];
  const epochDurationDays = Number(epochConfig.epochDurationDays);
  const defaultEpochs = Number(epochConfig.defaultEpochs);
  const maxEpochs = Number(epochConfig.maxEpochs);
  const config = getContractConfig(network);

  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  const walrus = useWalrusUpload();

  const {
    formattedBalance,
    isLoading: isLoadingBalance,
    balance: walBalanceRaw,
  } = useWalBalance();

  const {
    ownerCapId,
    isLoading: isOwnerCapLoading,
    error: ownerCapError,
  } = useOwnedCampaignCap(campaignId, network);

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
  const [error, setError] = useState<Error | null>(null);
  const [updateResult, setUpdateResult] = useState<CampaignUpdateResult | null>(
    null,
  );
  const [preparedUpdateData, setPreparedUpdateData] =
    useState<CampaignUpdateStorageData | null>(null);

  const {
    campaign,
    isPending: isCampaignLoading,
    error: campaignError,
  } = useCampaign(campaignId, network);

  const campaignDetailPath = useMemo(() => {
    const fallbackId = campaign?.id || campaignId || rawIdentifier;
    return buildCampaignDetailPath(fallbackId, {
      subdomainName: campaign?.subdomainName,
      campaignDomain: config.campaignDomain,
    });
  }, [
    campaign?.id,
    campaign?.subdomainName,
    campaignId,
    config.campaignDomain,
    rawIdentifier,
  ]);

  const form = useForm<CampaignUpdateFormData>({
    resolver: zodResolver(campaignUpdateSchema),
    defaultValues: DEFAULT_FORM_VALUES,
    mode: "onChange",
  });

  const updateContentValue = useWatch({
    control: form.control,
    name: "updateContent",
  });
  const debouncedUpdateContent = useDebounce(updateContentValue, 800);

  const {
    mutate: estimateStorageCost,
    data: costEstimate,
    isPending: isEstimatingCost,
    reset: resetCostEstimate,
  } = useEstimateUpdateStorageCost();

  const campaignEndDate = useMemo(() => {
    if (!campaign) {
      return null;
    }
    return new Date(campaign.endDateMs);
  }, [campaign]);

  const targetExpiryDate = useMemo(() => {
    if (!campaignEndDate) {
      return null;
    }
    return addMonths(campaignEndDate, 3);
  }, [campaignEndDate]);

  const desiredEpochs = useMemo(() => {
    if (!targetExpiryDate) {
      return null;
    }

    const today = new Date();
    const daysUntilExpiry = Math.max(
      1,
      differenceInCalendarDays(targetExpiryDate, today),
    );
    return Math.ceil(daysUntilExpiry / epochDurationDays);
  }, [targetExpiryDate, epochDurationDays]);

  const autoEpochs = useMemo(() => {
    if (!desiredEpochs) {
      return defaultEpochs;
    }

    const clamped = Math.min(Math.max(desiredEpochs, 1), maxEpochs);
    return clamped;
  }, [desiredEpochs, defaultEpochs, maxEpochs]);

  const [selectedEpochs, setSelectedEpochs] = useState<number>(
    autoEpochs ?? defaultEpochs,
  );

  useEffect(() => {
    setSelectedEpochs(autoEpochs ?? defaultEpochs);
  }, [autoEpochs, defaultEpochs]);

  useEffect(() => {
    const content = debouncedUpdateContent?.trim() ?? "";

    if (!content) {
      resetCostEstimate();
      return;
    }

    estimateStorageCost({
      data: {
        serializedContent: content,
        identifier: "update.json",
      },
      epochs: selectedEpochs,
    });
  }, [
    debouncedUpdateContent,
    estimateStorageCost,
    resetCostEstimate,
    selectedEpochs,
  ]);

  const isRegistrationPending =
    walrus.register.isPending ||
    walrus.upload.isPending ||
    walrus.certify.isPending ||
    isExecuting;

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

  useEffect(() => {
    if (
      wizardStep !== WizardStep.FORM &&
      wizardStep !== WizardStep.CONFIRM_TX
    ) {
      openModal(wizardStep);
    } else {
      closeModal();
    }
  }, [wizardStep, openModal, closeModal]);

  const isEpochsClamped = desiredEpochs !== null && desiredEpochs > autoEpochs;

  const actualReservationDays = selectedEpochs * epochDurationDays;

  const actualExpiryDate = useMemo(
    () => addDays(new Date(), actualReservationDays),
    [actualReservationDays],
  );

  const actualExpiryLabel = useMemo(
    () => format(actualExpiryDate, "MMM d, yyyy"),
    [actualExpiryDate],
  );

  const targetExpiryLabel = useMemo(() => {
    if (!targetExpiryDate) {
      return null;
    }
    return format(targetExpiryDate, "MMM d, yyyy");
  }, [targetExpiryDate]);

  const registrationSummary = useMemo(() => {
    if (!campaign) {
      return "Storage duration will be determined once campaign details load.";
    }

    if (targetExpiryLabel && isEpochsClamped) {
      return `Walrus caps storage at ${maxEpochs} epoch${
        maxEpochs !== 1 ? "s" : ""
      } (~${actualReservationDays} day${
        actualReservationDays !== 1 ? "s" : ""
      }). We reserved coverage through ${actualExpiryLabel}. Target coverage was ${targetExpiryLabel} (3 months after campaign end).`;
    }

    if (targetExpiryLabel) {
      return `Covers updates through ${targetExpiryLabel} (3 months after campaign end).`;
    }

    return `Storage reservation lasts until ${actualExpiryLabel}.`;
  }, [
    campaign,
    actualExpiryLabel,
    actualReservationDays,
    maxEpochs,
    isEpochsClamped,
    targetExpiryLabel,
  ]);

  const registrationPeriodHint = useMemo(() => {
    const epochLabel = `epoch${selectedEpochs !== 1 ? "s" : ""}`;
    const dayLabel = `day${actualReservationDays !== 1 ? "s" : ""}`;
    return `${selectedEpochs} ${epochLabel} × ${epochDurationDays} day${
      epochDurationDays !== 1 ? "s" : ""
    } = ${actualReservationDays} ${dayLabel}`;
  }, [selectedEpochs, epochDurationDays, actualReservationDays]);

  const registrationExpiresOverride = `${actualExpiryLabel} (${actualReservationDays} day${actualReservationDays !== 1 ? "s" : ""})`;

  const storageCosts: StorageCost[] = costEstimate
    ? [
        {
          label: "Update content",
          amount: `${(costEstimate.breakdown.jsonSize / 1024).toFixed(2)} KB`,
        },
        {
          label: `Storage (${costEstimate.epochs} epochs)`,
          amount: `${costEstimate.subsidizedStorageCost.toFixed(6)} WAL`,
        },
        {
          label: "Upload cost",
          amount: `${costEstimate.subsidizedUploadCost.toFixed(6)} WAL`,
        },
      ]
    : [
        { label: "Update content", amount: "Calculate first" },
        { label: "Storage epoch", amount: `${selectedEpochs} epochs` },
      ];

  const totalCost = costEstimate
    ? `${costEstimate.subsidizedTotalCost.toFixed(6)} WAL`
    : "Calculate first";

  const hasInsufficientBalance =
    costEstimate && !isLoadingBalance
      ? BigInt(Math.floor(costEstimate.subsidizedTotalCost * 10 ** 9)) >
        BigInt(walBalanceRaw ?? "0")
      : false;

  const handleRegisterStorageClick = async () => {
    if (walrus.prepare.isPending || isRegistrationPending) {
      return;
    }

    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    if (!currentAccount) {
      alert("Please connect your wallet first!");
      return;
    }

    if (!campaign) {
      setError(
        new Error("Campaign details are still loading. Please try again."),
      );
      return;
    }

    if (!ownerCapId) {
      setError(
        new Error(
          "You don't have permission to post updates for this campaign.",
        ),
      );
      return;
    }

    const updateContent = form.getValues("updateContent");
    const updatePlainText = lexicalToPlainText(updateContent);
    if (!updatePlainText) {
      form.setError("updateContent", {
        type: "manual",
        message: "Update content is required.",
      });
      return;
    }

    const updatePayload: CampaignUpdateStorageData = {
      serializedContent: updateContent,
      identifier: "update.json",
    };

    setPreparedUpdateData(updatePayload);
    setError(null);
    setCertifyRejectionMessage(null);
    setUpdateResult(null);
    setFlowState(null);
    setRegisterResult(null);
    setUploadCompleted(false);
    setCertifyResult(null);

    walrus.prepare.mutate(
      {
        purpose: "campaign-update",
        update: updatePayload,
        network,
        storageEpochs: selectedEpochs,
      },
      {
        onSuccess: (flow) => {
          setFlowState(flow);
          setWizardStep(WizardStep.CONFIRM_REGISTER);
        },
        onError: (err) => {
          setError(
            err instanceof Error
              ? err
              : new Error("Failed to prepare Walrus upload"),
          );
          setWizardStep(WizardStep.ERROR);
        },
      },
    );
  };

  const handleConfirmRegister = () => {
    if (!flowState) {
      return;
    }

    setWizardStep(WizardStep.REGISTERING);
    setError(null);
    setCertifyRejectionMessage(null);

    walrus.register.mutate(flowState, {
      onSuccess: (result) => {
        setRegisterResult(result);
        setWizardStep(WizardStep.UPLOADING);

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
              setError(err instanceof Error ? err : new Error("Unknown error"));
              setWizardStep(WizardStep.ERROR);
            },
          },
        );
      },
      onError: (err) => {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setWizardStep(WizardStep.ERROR);
      },
    });
  };

  const handleRetryUpload = () => {
    if (!registerResult) {
      return;
    }

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
          setError(err instanceof Error ? err : new Error("Unknown error"));
          setWizardStep(WizardStep.ERROR);
        },
      },
    );
  };

  const startCertifyFlow = (state: WalrusFlowState | null) => {
    if (!state || walrus.certify.isPending) {
      return;
    }

    setWizardStep(WizardStep.CERTIFYING);
    setError(null);
    setCertifyRejectionMessage(null);

    walrus.certify.mutate(state, {
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
    if (!registerResult) {
      return;
    }

    startCertifyFlow(registerResult.flowState);
  };

  const handleConfirmTransaction = async () => {
    if (!certifyResult) {
      return;
    }

    if (!campaign || !ownerCapId) {
      setError(new Error("Missing campaign access to finalize the update."));
      setWizardStep(WizardStep.ERROR);
      return;
    }

    setWizardStep(WizardStep.EXECUTING);
    setError(null);

    try {
      const metadata: Record<string, string> = {
        walrus_blob_id: certifyResult.blobId,
        walrus_storage_epochs: certifyResult.storageEpochs.toString(),
        walrus_content_path: preparedUpdateData?.identifier ?? "update.json",
      };

      const transaction = buildAddUpdateTransaction(
        campaign.id,
        ownerCapId,
        metadata,
        network,
      );

      const result = await signAndExecute({
        transaction,
        chain: `sui:${network}`,
      });

      if (!result) {
        throw new Error("Transaction failed: No result returned");
      }

      const updateId = extractCampaignUpdateIdFromEffects(
        result,
        config.contracts.packageId,
      );

      if (!updateId) {
        throw new Error("Failed to extract update ID from transaction effects");
      }

      const walrusContentUrl = getWalrusUrl(
        certifyResult.blobId,
        network,
        preparedUpdateData?.identifier ?? "update.json",
      );

      const finalResult: CampaignUpdateResult = {
        campaignId: campaign.id,
        updateId,
        transactionDigest: result.digest,
        walrusBlobId: certifyResult.blobId,
        walrusContentUrl,
      };

      setUpdateResult(finalResult);
      setWizardStep(WizardStep.SUCCESS);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setWizardStep(WizardStep.ERROR);
    }
  };

  const handleCancelRegister = () => {
    setWizardStep(WizardStep.FORM);
    setCertifyRejectionMessage(null);
    closeModal();
  };

  const handleCancelTransaction = () => {
    setWizardStep(WizardStep.FORM);
    setCertifyRejectionMessage(null);
  };

  const handleRetry = () => {
    setError(null);

    if (certifyResult) {
      setWizardStep(WizardStep.CONFIRM_TX);
    } else if (uploadCompleted && registerResult) {
      startCertifyFlow(registerResult.flowState);
    } else if (uploadCompleted) {
      setWizardStep(WizardStep.CONFIRM_REGISTER);
    } else if (registerResult) {
      handleRetryUpload();
    } else if (flowState) {
      setWizardStep(WizardStep.CONFIRM_REGISTER);
    } else {
      setWizardStep(WizardStep.FORM);
    }
  };

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
        setFlowState(null);
        setRegisterResult(null);
        setUploadCompleted(false);
      }

      setCertifyRejectionMessage(null);
    }
  };

  const identifierDisplay = rawIdentifier || campaignId || "";

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
    return <CampaignResolutionNotFound identifier={identifierDisplay} />;
  }

  return (
    <FormProvider {...form}>
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
        campaignResult={null}
        updateResult={updateResult}
        errorTitle={errorHeading || undefined}
        error={errorBody || rawErrorMessage || undefined}
        mode="campaign-update"
        subdomainName={campaign?.subdomainName}
      />

      <div className="py-8">
        <div className="container px-4">
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={ROUTES.HOME}>Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={campaignDetailPath}>Campaign</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Post Update</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="container px-4 flex justify-center">
          <div className="w-full max-w-3xl px-4">
            {campaignError && (
              <Alert className="mb-8" variant="destructive">
                <AlertDescription>
                  Failed to load campaign details. Please try again.
                </AlertDescription>
              </Alert>
            )}

            {!currentAccount && (
              <Alert className="mb-6 border-yellow-500 bg-yellow-50">
                <AlertDescription>
                  Connect your wallet to post campaign updates.
                </AlertDescription>
              </Alert>
            )}

            {currentAccount && !ownerCapId && !isOwnerCapLoading && (
              <Alert className="mb-6" variant="destructive">
                <AlertDescription>
                  This wallet is not authorized to post updates for this
                  campaign.
                </AlertDescription>
              </Alert>
            )}

            {ownerCapError && (
              <Alert className="mb-6" variant="destructive">
                <AlertDescription>{ownerCapError.message}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                }}
                noValidate
              >
                <div className="flex flex-col gap-16">
                  <fieldset
                    disabled={isFormLocked}
                    className="flex flex-col gap-16"
                  >
                    <div className="flex flex-col items-center text-center gap-4 mb-16">
                      <h1 className="text-4xl font-bold mb-4">
                        Post Campaign Update
                      </h1>
                      <p className="text-muted-foreground text-base">
                        Start drafting your campaign updates below. Based on
                        your post a storage cost will be calculated and
                        registered through a transaction from your wallet.
                      </p>
                    </div>

                    {isCampaignLoading && (
                      <Alert>
                        <AlertDescription>
                          Loading campaign details…
                        </AlertDescription>
                      </Alert>
                    )}

                    <section className="flex flex-col gap-8 mb-12">
                      <CampaignUpdateEditor disabled={isFormLocked} />
                    </section>
                  </fieldset>

                  <Separator />

                  <CampaignStorageRegistrationCard
                    costs={storageCosts}
                    totalCost={totalCost}
                    isCalculating={isEstimatingCost}
                    onRegister={handleRegisterStorageClick}
                    selectedEpochs={selectedEpochs}
                    disabled={
                      isCampaignLoading ||
                      isOwnerCapLoading ||
                      !currentAccount ||
                      !ownerCapId
                    }
                    isPreparing={walrus.prepare.isPending}
                    isLocked={isFormLocked}
                    estimatedCost={costEstimate}
                    disableEpochSelection
                    registrationPeriodSummary={registrationSummary}
                    registrationPeriodHint={registrationPeriodHint}
                    registrationExpiresOverride={registrationExpiresOverride}
                    walBalance={
                      isLoadingBalance ? "Loading..." : formattedBalance
                    }
                    hasInsufficientBalance={hasInsufficientBalance}
                    requiredWalAmount={costEstimate?.subsidizedTotalCost}
                    certifyErrorMessage={certifyRejectionMessage}
                    onRetryCertify={handleRetryCertify}
                    isRetryingCertify={walrus.certify.isPending}
                    storageRegistered={hasCompletedStorageRegistration}
                    hideRegisterButton={
                      Boolean(certifyRejectionMessage) ||
                      hasCompletedStorageRegistration
                    }
                  />

                  <Separator />

                  <section className="flex flex-col gap-6">
                    <Alert className="mb-6">
                      <AlertDescription className="flex items-center gap-2">
                        <AlertCircleIcon className="size-4" />
                        You can publish update after completing the “Register
                        Storage” step
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
                          !certifyResult ||
                          !ownerCapId ||
                          isOwnerCapLoading
                        }
                      >
                        {isExecuting ? "Posting..." : "Post Update"}
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
