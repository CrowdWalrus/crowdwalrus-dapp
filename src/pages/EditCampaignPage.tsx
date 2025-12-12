import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useForm,
  useWatch,
  type FieldNamesMarkedBoolean,
  type Path,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "sonner";

import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { useCampaign } from "@/features/campaigns/hooks/useCampaign";
import { useResolvedCampaignId } from "@/features/campaigns/hooks/useResolvedCampaignId";
import type { CampaignData } from "@/features/campaigns/hooks/useAllCampaigns";
import { useOwnedCampaignCap } from "@/features/campaigns/hooks/useOwnedCampaignCap";
import {
  useWalrusUpload,
  type WalrusFlowState,
  type RegisterResult,
  type CertifyResult,
} from "@/features/campaigns/hooks/useWalrusUpload";
import {
  useUpdateCampaignBasics,
  useUpdateCampaignMetadata,
} from "@/features/campaigns/hooks/useCampaignMutations";
import { useWalrusDescription } from "@/features/campaigns/hooks/useWalrusDescription";
import { useWalrusImage } from "@/features/campaigns/hooks/useWalrusImage";
import {
  buildEditCampaignSchema,
  type EditCampaignFormData,
} from "@/features/campaigns/schemas/editCampaignSchema";
import { transformEditCampaignFormData } from "@/features/campaigns/utils/transformEditCampaignFormData";
import { sanitizeSocialLinks } from "@/features/campaigns/utils/socials";
import type { CampaignSocialLink } from "@/features/campaigns/types/campaign";
import {
  mapCampaignError,
  extractMoveAbortCode,
} from "@/features/campaigns/utils/errorMapping";
import { getContractConfig, CLOCK_OBJECT_ID } from "@/shared/config/contracts";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import { ROUTES } from "@/shared/config/routes";
import { buildCampaignDetailPath } from "@/shared/utils/routes";
import { formatUsdLocaleFromMicros } from "@/shared/utils/currency";
import {
  CampaignResolutionError,
  CampaignResolutionLoading,
  CampaignResolutionMissing,
  CampaignResolutionNotFound,
} from "@/features/campaigns/components/CampaignResolutionStates";
import { DEFAULT_POLICY_PRESET } from "@/features/campaigns/constants/policies";
import {
  CampaignCoverImageUpload,
  CampaignDetailsEditor,
  CampaignTypeSelector,
  CampaignCategorySelector,
  CampaignSocialsSection,
  CampaignStorageRegistrationCard,
  type StorageCost,
} from "@/features/campaigns/components/new-campaign";
import {
  CampaignCreationModal,
  useCampaignCreationModal,
} from "@/features/campaigns/components/campaign-creation-modal";
import { WalrusReuploadWarningModal } from "@/features/campaigns/components/modals/WalrusReuploadWarningModal";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/shared/components/ui/breadcrumb";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Separator } from "@/shared/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { isUserRejectedError } from "@/shared/utils/errors";
import {
  AlertCircle as AlertCircleIcon,
  DollarSign,
  PencilLineIcon,
} from "lucide-react";
import { Label } from "@/shared/components/ui/label";
import { useWalBalance } from "@/shared/hooks/useWalBalance";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useEstimateStorageCost } from "@/features/campaigns/hooks/useCreateCampaign";
import { WizardStep } from "@/features/campaigns/types/campaign";
import { normalizeSerializedEditorStateString } from "@/shared/components/editor/utils/normalizeSerializedState";

const DEFAULT_FORM_VALUES: EditCampaignFormData = {
  campaignName: "",
  description: "",
  campaignType: DEFAULT_POLICY_PRESET,
  categories: [],
  socials: [],
  campaignDetails: "",
  coverImage: undefined,
  storageEpochs: undefined,
};

const SAVE_STATUS_TIMEOUT = 4000;
const AUTO_CALCULATING_LABEL = "Calculating...";

type SectionKey =
  | "campaignName"
  | "description"
  | "coverImage"
  | "details"
  | "campaignType"
  | "categories"
  | "socials";

const REQUIRED_FIELD_ORDER: (keyof EditCampaignFormData)[] = [
  "campaignName",
  "description",
  "categories",
  "coverImage",
  "socials",
  "campaignDetails",
];

function parseCategories(category: string | undefined | null): string[] {
  if (!category) {
    return [];
  }

  return category
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildSocialsFromMetadata(
  campaign: CampaignData | null,
): EditCampaignFormData["socials"] {
  const socialLinks: CampaignSocialLink[] = campaign?.socialLinks ?? [];

  return socialLinks.map(({ platform, url }) => ({
    platform,
    url,
  }));
}

const isEditFieldDirty = (
  dirtyFields: FieldNamesMarkedBoolean<EditCampaignFormData>,
  key: keyof EditCampaignFormData,
) => {
  const value = dirtyFields[key];
  if (Array.isArray(value)) {
    return value.some(Boolean);
  }
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some(Boolean);
  }
  return Boolean(value);
};

async function fetchCoverImageFile(url: string): Promise<File> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch existing cover image from Walrus");
  }
  const blob = await response.blob();
  const extension = blob.type === "image/png" ? "png" : "jpg";
  return new File([blob], `cover.${extension}`, {
    type: blob.type || "image/jpeg",
  });
}

interface WalrusSnapshot {
  details: string;
  coverImageKey: string;
  storageEpochs?: number;
}

const buildCoverImageKey = (
  coverImage: File | null | undefined,
  fallbackUrl: string | null,
) => {
  if (coverImage instanceof File) {
    return `${coverImage.name}-${coverImage.size}-${coverImage.lastModified}`;
  }
  return fallbackUrl ?? "no-cover-image";
};

const areSnapshotsEqual = (
  a: WalrusSnapshot | null,
  b: WalrusSnapshot | null,
) => {
  if (!a || !b) {
    return false;
  }
  return (
    a.details === b.details &&
    a.coverImageKey === b.coverImageKey &&
    (a.storageEpochs ?? null) === (b.storageEpochs ?? null)
  );
};

export default function EditCampaignPage() {
  useDocumentTitle("Edit Campaign");

  const { id: campaignIdParam } = useParams<{ id: string }>();
  const rawIdentifier = campaignIdParam ?? "";
  const {
    campaignId: resolvedCampaignId,
    isLoading: isResolvingIdentifier,
    notFound: isIdentifierNotFound,
    error: identifierError,
  } = useResolvedCampaignId(rawIdentifier);
  const campaignId = resolvedCampaignId ?? "";
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const network = DEFAULT_NETWORK;
  const config = getContractConfig(network);

  const [initialized, setInitialized] = useState(false);
  const [initialDescription, setInitialDescription] = useState("");
  const [walrusErrorAcknowledged, setWalrusErrorAcknowledged] = useState(false);
  const [editingSections, setEditingSections] = useState<
    Record<SectionKey, boolean>
  >({
    campaignName: false,
    description: false,
    coverImage: false,
    details: false,
    campaignType: false,
    categories: false,
    socials: false,
  });
  const [pendingWalrusSection, setPendingWalrusSection] =
    useState<SectionKey | null>(null);
  const [savedSections, setSavedSections] = useState<
    Record<SectionKey, number>
  >({
    campaignName: 0,
    description: 0,
    coverImage: 0,
    details: 0,
    campaignType: 0,
    categories: 0,
    socials: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modal = useCampaignCreationModal();
  const { openModal, closeModal } = modal;
  const [wizardStep, setWizardStep] = useState<WizardStep>(WizardStep.FORM);
  const [walrusFlowState, setWalrusFlowState] =
    useState<WalrusFlowState | null>(null);
  const [uploadCompleted, setUploadCompleted] = useState(false);
  const [walrusError, setWalrusError] = useState<Error | null>(null);
  const [walrusErrorTitle, setWalrusErrorTitle] = useState<string | null>(null);
  const [walrusStatus, setWalrusStatus] = useState<"idle" | "completed">(
    "idle",
  );
  const [walrusRegisterResult, setWalrusRegisterResult] =
    useState<RegisterResult | null>(null);
  const [walrusCertifyResult, setWalrusCertifyResult] =
    useState<CertifyResult | null>(null);
  const [certifyRejectionMessage, setCertifyRejectionMessage] = useState<
    string | null
  >(null);
  const walrusBaselineRef = useRef<WalrusSnapshot | null>(null);
  const coverImageFileRef = useRef<File | null>(null);
  const coverImageFilePromiseRef = useRef<Promise<File> | null>(null);
  const [descriptionInstanceKey, setDescriptionInstanceKey] = useState(0);

  const resetWalrusState = useCallback(() => {
    setWalrusStatus("idle");
    setWalrusFlowState(null);
    setWalrusRegisterResult(null);
    setWalrusCertifyResult(null);
    setCertifyRejectionMessage(null);
    setUploadCompleted(false);
    setWalrusError(null);
    setWalrusErrorTitle(null);
    setWizardStep(WizardStep.FORM);
  }, []);

  const initialValuesRef = useRef<EditCampaignFormData>(DEFAULT_FORM_VALUES);

  const form = useForm<EditCampaignFormData>({
    resolver: zodResolver(buildEditCampaignSchema()),
    mode: "onChange",
    shouldFocusError: false,
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const watchedValues = useWatch<EditCampaignFormData>({
    control: form.control,
  });
  const { dirtyFields } = form.formState as {
    dirtyFields: FieldNamesMarkedBoolean<EditCampaignFormData>;
  };
  const currentFormValues: EditCampaignFormData = watchedValues
    ? ({
        ...DEFAULT_FORM_VALUES,
        ...watchedValues,
      } as EditCampaignFormData)
    : form.getValues();

  const {
    campaign,
    isPending: isCampaignLoading,
    error: campaignError,
    refetch: refetchCampaign,
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

  const {
    ownerCapId,
    isLoading: isCapLoading,
    error: capError,
    refetch: refetchCap,
  } = useOwnedCampaignCap(campaignId, network);

  const walrusDescriptionQuery = useWalrusDescription(campaign?.descriptionUrl);
  const walrusDescription = walrusDescriptionQuery.data ?? "";
  const isWalrusLoading = walrusDescriptionQuery.isLoading;
  const isWalrusError = walrusDescriptionQuery.isError;
  const refetchWalrus = walrusDescriptionQuery.refetch;

  const walrusCoverImageQuery = useWalrusImage(campaign?.coverImageUrl);
  const walrusCoverImageUrl = walrusCoverImageQuery.data;
  const isWalrusImageError = Boolean(walrusCoverImageQuery.error);
  const refetchWalrusImage = walrusCoverImageQuery.refetch;

  const walrus = useWalrusUpload();
  const {
    formattedBalance,
    isLoading: isLoadingWalBalance,
    balance: walBalanceRaw,
  } = useWalBalance();
  const {
    mutateAsync: estimateStorageCost,
    data: costEstimate,
    isPending: isEstimatingStorage,
    reset: resetStorageEstimate,
  } = useEstimateStorageCost();
  const updateBasics = useUpdateCampaignBasics();
  const updateMetadata = useUpdateCampaignMetadata();
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction({});

  const hasCampaign = Boolean(campaign);
  const isDeleted = campaign?.isDeleted ?? false;

  useEffect(() => {
    if (wizardStep !== WizardStep.FORM) {
      openModal(wizardStep);
    } else {
      closeModal();
    }
  }, [closeModal, openModal, wizardStep]);

  useEffect(() => {
    if (!hasCampaign) {
      return;
    }

    if (isWalrusLoading) {
      return;
    }

    const descriptionValueRaw = isWalrusError ? "" : walrusDescription;
    const normalizedDescription =
      normalizeSerializedEditorStateString(descriptionValueRaw);
    const shouldReset =
      !initialized ||
      (initialDescription === "" && Boolean(normalizedDescription));

    if (!shouldReset) {
      return;
    }

    const resetValues: EditCampaignFormData = {
      campaignName: campaign?.name ?? "",
      description: campaign?.shortDescription ?? "",
      campaignType: campaign?.policyPresetName ?? DEFAULT_POLICY_PRESET,
      categories: parseCategories(campaign?.category),
      socials: buildSocialsFromMetadata(campaign),
      campaignDetails: normalizedDescription,
      coverImage: undefined,
      storageEpochs: campaign?.walrusStorageEpochs
        ? Number(campaign.walrusStorageEpochs)
        : undefined,
    };

    form.reset(resetValues);
    initialValuesRef.current = resetValues;
    setInitialDescription(normalizedDescription);
    setDescriptionInstanceKey((prev) => prev + 1);
    setInitialized(true);
  }, [
    hasCampaign,
    campaign,
    form,
    initialized,
    initialDescription,
    isWalrusLoading,
    isWalrusError,
    walrusDescription,
  ]);

  const handleRetryWalrus = () => {
    if (isWalrusError) {
      refetchWalrus();
    }
    if (isWalrusImageError) {
      refetchWalrusImage();
    }
    setWalrusErrorAcknowledged(false);
  };

  const watchCampaignDetails = form.watch("campaignDetails");
  const watchCoverImage = form.watch("coverImage");
  const watchStorageEpochs = form.watch("storageEpochs");
  const selectedEpochs =
    watchStorageEpochs ??
    (campaign?.walrusStorageEpochs
      ? Number(campaign.walrusStorageEpochs)
      : undefined);
  const coverImagePreviewUrl =
    walrusCoverImageUrl ?? campaign?.coverImageUrl ?? null;

  const currentWalrusSnapshot = useMemo<WalrusSnapshot | null>(() => {
    if (!initialized) {
      return null;
    }

    const details =
      typeof watchCampaignDetails === "string"
        ? watchCampaignDetails
        : (watchCampaignDetails ?? "");

    return {
      details,
      coverImageKey: buildCoverImageKey(
        watchCoverImage as File | null | undefined,
        campaign?.coverImageUrl ?? null,
      ),
      storageEpochs:
        typeof selectedEpochs === "number" ? selectedEpochs : undefined,
    };
  }, [
    campaign?.coverImageUrl,
    initialized,
    selectedEpochs,
    watchCampaignDetails,
    watchCoverImage,
  ]);
  const debouncedWalrusSnapshot = useDebounce(currentWalrusSnapshot, 800);

  useEffect(() => {
    if (watchCoverImage instanceof File) {
      coverImageFileRef.current = watchCoverImage;
      coverImageFilePromiseRef.current = null;
    }
  }, [watchCoverImage]);

  useEffect(() => {
    coverImageFileRef.current = null;
    coverImageFilePromiseRef.current = null;
  }, [campaign?.coverImageUrl]);

  const ensureCoverImageFile = useCallback(async (): Promise<File | null> => {
    if (coverImageFileRef.current) {
      return coverImageFileRef.current;
    }

    if (!campaign?.coverImageUrl) {
      return null;
    }

    if (!coverImageFilePromiseRef.current) {
      coverImageFilePromiseRef.current = fetchCoverImageFile(
        campaign.coverImageUrl,
      )
        .then((file) => {
          coverImageFileRef.current = file;
          return file;
        })
        .catch((error) => {
          console.error(
            "Failed to fetch existing cover image for Walrus estimation:",
            error,
          );
          coverImageFilePromiseRef.current = null;
          throw error;
        });
    }

    try {
      return await coverImageFilePromiseRef.current;
    } catch {
      return null;
    }
  }, [campaign?.coverImageUrl]);

  const transformPreviewResult = campaign
    ? transformEditCampaignFormData({
        values: currentFormValues,
        dirtyFields,
        campaign,
        initialDescription,
      })
    : null;

  const walrusChangesDetected = Boolean(
    transformPreviewResult?.shouldUploadWalrus,
  );

  useEffect(() => {
    if (!initialized || !currentWalrusSnapshot) {
      return;
    }
    if (!walrusBaselineRef.current) {
      walrusBaselineRef.current = currentWalrusSnapshot;
    }
  }, [initialized, currentWalrusSnapshot]);

  useEffect(() => {
    if (walrusStatus !== "completed" || !currentWalrusSnapshot) {
      return;
    }
    if (
      walrusBaselineRef.current &&
      !areSnapshotsEqual(walrusBaselineRef.current, currentWalrusSnapshot)
    ) {
      resetWalrusState();
      resetStorageEstimate();
    }
  }, [
    currentWalrusSnapshot,
    resetWalrusState,
    resetStorageEstimate,
    walrusStatus,
  ]);

  useEffect(() => {
    if (!initialized) {
      return;
    }
    if (!campaign) {
      return;
    }
    if (!walrusChangesDetected) {
      resetStorageEstimate();
      return;
    }
    if (!debouncedWalrusSnapshot) {
      return;
    }

    const epochsToUse =
      typeof debouncedWalrusSnapshot.storageEpochs === "number"
        ? debouncedWalrusSnapshot.storageEpochs
        : typeof selectedEpochs === "number"
          ? selectedEpochs
          : campaign.walrusStorageEpochs
            ? Number(campaign.walrusStorageEpochs)
            : undefined;

    if (!epochsToUse || epochsToUse <= 0) {
      return;
    }

    let cancelled = false;

    const runEstimation = async () => {
      const values = form.getValues();

      const { metadataPatch } = transformEditCampaignFormData({
        values,
        dirtyFields,
        campaign,
        initialDescription,
      });

      let coverImageFile: File | null = null;
      if (values.coverImage instanceof File) {
        coverImageFile = values.coverImage;
      } else {
        coverImageFile = await ensureCoverImageFile();
      }

      if (!coverImageFile || cancelled) {
        return;
      }

      const sanitizedSocials = sanitizeSocialLinks(values.socials);
      const policyPresetName =
        values.campaignType || campaign.policyPresetName || DEFAULT_POLICY_PRESET;

      const walrusFormData = {
        name: campaign.name,
        short_description: values.description,
        subdomain_name: campaign.subdomainName,
        category: metadataPatch.category ?? campaign.category ?? "",
        policyPresetName,
        funding_goal: campaign.fundingGoal ?? "0",
        start_date: new Date(campaign.startDateMs),
        end_date: new Date(campaign.endDateMs),
        recipient_address: campaign.recipientAddress,
        full_description: values.campaignDetails ?? "",
        cover_image: coverImageFile,
        socials: sanitizedSocials,
      };

      try {
        await estimateStorageCost({
          formData: walrusFormData,
          epochs: epochsToUse,
        });
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to auto-estimate Walrus storage cost:", error);
        }
      }
    };

    runEstimation();

    return () => {
      cancelled = true;
    };
  }, [
    campaign,
    debouncedWalrusSnapshot,
    dirtyFields,
    ensureCoverImageFile,
    estimateStorageCost,
    form,
    initialDescription,
    initialized,
    resetStorageEstimate,
    selectedEpochs,
    walrusChangesDetected,
  ]);

  const storageRegistrationComplete =
    walrusStatus === "completed" && Boolean(walrusCertifyResult);

  const showConnectWalletMessage = !account;
  const notAuthorized = Boolean(account) && !ownerCapId && !isCapLoading;

  const loading =
    isCampaignLoading ||
    isCapLoading ||
    (!initialized && isWalrusLoading && !isWalrusError);

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

  if (loading) {
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

  if (campaignError) {
    return (
      <div className="py-8">
        <div className="container px-4 max-w-4xl">
          <Card className="border-red-500">
            <CardContent className="pt-6 flex flex-col gap-4">
              <div>
                <p className="text-red-600 font-semibold mb-1">
                  Error loading campaign
                </p>
                <p className="text-sm text-muted-foreground">
                  {campaignError.message}
                </p>
              </div>
              <Button variant="outline" onClick={() => refetchCampaign()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!hasCampaign || isDeleted) {
    return (
      <div className="py-8">
        <div className="container px-4 max-w-4xl">
          <Card className="border-yellow-500">
            <CardContent className="pt-6 flex flex-col gap-2">
              <p className="text-yellow-600 font-semibold">
                Campaign not found
              </p>
              <p className="text-sm text-muted-foreground">
                Campaign ID: {campaignId}
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

  if (showConnectWalletMessage) {
    return (
      <div className="py-8">
        <div className="container px-4 max-w-4xl">
          <Card className="border-yellow-500">
            <CardContent className="pt-6 flex flex-col gap-2">
              <p className="text-yellow-600 font-semibold">
                Connect your wallet
              </p>
              <p className="text-sm text-muted-foreground">
                Please connect the wallet that owns this campaign to continue
                with edits.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (capError) {
    return (
      <div className="py-8">
        <div className="container px-4 max-w-4xl">
          <Card className="border-red-500">
            <CardContent className="pt-6 flex flex-col gap-4">
              <div>
                <p className="text-red-600 font-semibold mb-1">
                  Error verifying ownership
                </p>
                <p className="text-sm text-muted-foreground">
                  {capError.message}
                </p>
              </div>
              <Button variant="outline" onClick={() => refetchCap()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (notAuthorized) {
    return (
      <div className="py-8">
        <div className="container px-4 max-w-4xl">
          <Card className="border-red-500">
            <CardContent className="pt-6 flex flex-col gap-2">
              <p className="text-red-600 font-semibold">Not authorized</p>
              <p className="text-sm text-muted-foreground">
                The connected wallet does not have permission to edit this
                campaign.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const requireWalrusRegistration =
    walrusChangesDetected && !storageRegistrationComplete;

  const hasAnyChanges =
    initialized &&
    Boolean(
      transformPreviewResult &&
        (transformPreviewResult.hasBasicsChanges ||
          transformPreviewResult.hasMetadataChanges ||
          transformPreviewResult.shouldUploadWalrus),
    );

  const campaignData = campaign!;

  const formattedSubdomain = campaignData.subdomainName ?? "";
  const formattedStartDate =
    campaignData.startDateMs != null
      ? new Date(campaignData.startDateMs).toLocaleDateString()
      : "";
  const formattedEndDate =
    campaignData.endDateMs != null
      ? new Date(campaignData.endDateMs).toLocaleDateString()
      : "";
  const formattedFundingGoal = formatUsdLocaleFromMicros(
    campaignData.fundingGoalUsdMicro,
  );
  const formattedRecipientAddress = campaignData.recipientAddress ?? "";

  const campaignNameDirty = isEditFieldDirty(dirtyFields, "campaignName");
  const descriptionDirty = isEditFieldDirty(dirtyFields, "description");
  const coverImageDirty = Boolean(dirtyFields.coverImage);
  const detailsDirty = isEditFieldDirty(dirtyFields, "campaignDetails");
  const storageEpochsDirty = isEditFieldDirty(dirtyFields, "storageEpochs");
  const campaignTypeDirty = isEditFieldDirty(dirtyFields, "campaignType");
  const categoriesDirty = isEditFieldDirty(dirtyFields, "categories");
  const socialsDirty = isEditFieldDirty(dirtyFields, "socials");

  const mediaSectionDisabled = isWalrusError || isWalrusImageError;
  const walrusWarningVisible =
    (isWalrusError || isWalrusImageError) && !walrusErrorAcknowledged;

  const startCertifyFlow = async (flowState: WalrusFlowState | null) => {
    if (!flowState || walrus.certify.isPending) {
      return;
    }

    setWalrusError(null);
    setWalrusErrorTitle(null);
    setCertifyRejectionMessage(null);
    setWizardStep(WizardStep.CERTIFYING);

    try {
      const result = await walrus.certify.mutateAsync(flowState);
      setWalrusCertifyResult(result);
      setWalrusStatus("completed");
      if (currentWalrusSnapshot) {
        walrusBaselineRef.current = currentWalrusSnapshot;
      }
      closeModal();
      setWizardStep(WizardStep.FORM);
      toast.success(
        "Walrus storage registered. Publish update to finalize on-chain metadata.",
      );
    } catch (error) {
      if (isUserRejectedError(error)) {
        setCertifyRejectionMessage(
          "Approve the certification transaction in your wallet to continue.",
        );
        closeModal();
        setWizardStep(WizardStep.FORM);
        return;
      }

      const err = error instanceof Error ? error : new Error("Unknown error");
      setWalrusError(err);
      setWalrusErrorTitle("Walrus certification failed");
      setWizardStep(WizardStep.ERROR);
    }
  };

  const handleRegisterStorage = async () => {
    if (!account) {
      toast.error("Connect your wallet before registering Walrus storage.");
      return;
    }

    const isValid = await form.trigger(undefined, { shouldFocus: false });
    if (!isValid) {
      scrollToFirstInvalidField();
      return;
    }

    if (!walrusChangesDetected) {
      toast.info("No Walrus-related changes detected.");
      return;
    }

    const values = form.getValues();
    const {
      metadataPatch,
      coverImageChanged,
      descriptionChanged,
      storageEpochsChanged,
    } = transformEditCampaignFormData({
      values,
      dirtyFields,
      campaign: campaignData,
      initialDescription,
    });

    const walrusChanges =
      coverImageChanged || descriptionChanged || storageEpochsChanged;

    if (!walrusChanges) {
      toast.info("No Walrus-related changes detected.");
      return;
    }

    const epochsToUse = typeof selectedEpochs === "number" ? selectedEpochs : 0;

    if (!epochsToUse) {
      toast.error("Storage epochs must be greater than zero.");
      return;
    }

    try {
      setWalrusStatus("idle");
      setWalrusCertifyResult(null);
      setWalrusError(null);
      setWalrusErrorTitle(null);
      setUploadCompleted(false);
      setCertifyRejectionMessage(null);
      setWalrusFlowState(null);
      setWalrusRegisterResult(null);

      let coverImageFile: File | null = null;
      if (coverImageChanged && values.coverImage instanceof File) {
        coverImageFile = values.coverImage;
      } else if (campaignData.coverImageUrl) {
        coverImageFile = await fetchCoverImageFile(campaignData.coverImageUrl);
      }

      if (!coverImageFile) {
        toast.error("Cover image is required for Walrus storage registration.");
        return;
      }

      const sanitizedSocials = sanitizeSocialLinks(values.socials);
      const policyPresetName =
        values.campaignType ||
        campaignData.policyPresetName ||
        DEFAULT_POLICY_PRESET;

      const walrusFormData = {
        name: campaignData.name,
        short_description: values.description,
        subdomain_name: campaignData.subdomainName,
        category: metadataPatch.category ?? campaignData.category ?? "",
        policyPresetName,
        funding_goal: campaignData.fundingGoal ?? "0",
        start_date: new Date(campaignData.startDateMs),
        end_date: new Date(campaignData.endDateMs),
        recipient_address: campaignData.recipientAddress,
        full_description: values.campaignDetails ?? "",
        cover_image: coverImageFile,
        socials: sanitizedSocials,
      };

      const estimate = await estimateStorageCost({
        formData: walrusFormData,
        epochs: epochsToUse,
      });

      if (!isLoadingWalBalance) {
        const requiredWalUnits = BigInt(
          Math.floor(estimate.subsidizedTotalCost * 10 ** 9),
        );
        const availableWal = BigInt(walBalanceRaw || "0");
        if (requiredWalUnits > availableWal) {
          toast.error("Insufficient WAL balance to register storage.");
          return;
        }
      }

      const flowState = await walrus.prepare.mutateAsync({
        formData: walrusFormData,
        storageEpochs: epochsToUse,
        network,
      });

      setWalrusFlowState(flowState);
      setWizardStep(WizardStep.CONFIRM_REGISTER);
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      setWalrusError(err);
      setWalrusErrorTitle("Unable to prepare Walrus upload");
      setWizardStep(WizardStep.ERROR);
    }
  };

  const handleConfirmRegisterStorage = async () => {
    if (!walrusFlowState) {
      return;
    }

    setWalrusError(null);
    setWalrusErrorTitle(null);
    setCertifyRejectionMessage(null);

    try {
      setWizardStep(WizardStep.REGISTERING);
      const registerResult = await walrus.register.mutateAsync(walrusFlowState);
      setWalrusRegisterResult(registerResult);

      setWizardStep(WizardStep.UPLOADING);
      await walrus.upload.mutateAsync({
        flowState: registerResult.flowState,
        registerDigest: registerResult.transactionDigest,
      });
      setUploadCompleted(true);

      await startCertifyFlow(registerResult.flowState);
    } catch (error) {
      if (isUserRejectedError(error)) {
        toast.info(
          "Storage registration transaction was cancelled in your wallet.",
        );
        setWizardStep(WizardStep.FORM);
        return;
      }

      const err = error instanceof Error ? error : new Error("Unknown error");
      setWalrusError(err);
      setWalrusErrorTitle("Walrus registration failed");
      setWizardStep(WizardStep.ERROR);
    }
  };

  const handleRetryUpload = async () => {
    if (!walrusRegisterResult) {
      return;
    }

    setWalrusError(null);
    setWalrusErrorTitle(null);
    setWizardStep(WizardStep.UPLOADING);

    try {
      await walrus.upload.mutateAsync({
        flowState: walrusRegisterResult.flowState,
        registerDigest: walrusRegisterResult.transactionDigest,
      });
      setUploadCompleted(true);
      await startCertifyFlow(walrusRegisterResult.flowState);
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      setWalrusError(err);
      setWalrusErrorTitle("Walrus upload failed");
      setWizardStep(WizardStep.ERROR);
    }
  };

  const handleRetryCertify = () => {
    if (!walrusRegisterResult) {
      return;
    }

    void startCertifyFlow(walrusRegisterResult.flowState);
  };

  const handleWalrusModalRetry = () => {
    setWalrusError(null);
    setWalrusErrorTitle(null);

    if (uploadCompleted && walrusRegisterResult) {
      void startCertifyFlow(walrusRegisterResult.flowState);
      return;
    }

    if (walrusRegisterResult) {
      void handleRetryUpload();
      return;
    }

    if (walrusFlowState) {
      setWizardStep(WizardStep.CONFIRM_REGISTER);
      return;
    }

    setWizardStep(WizardStep.FORM);
  };

  const handleCancelRegister = () => {
    setWizardStep(WizardStep.FORM);
    setWalrusFlowState(null);
    setWalrusRegisterResult(null);
    setUploadCompleted(false);
    setWalrusError(null);
    setWalrusErrorTitle(null);
    setCertifyRejectionMessage(null);
    closeModal();
  };

  const handleModalClose = () => {
    if (wizardStep === WizardStep.ERROR || wizardStep === WizardStep.FORM) {
      setWizardStep(WizardStep.FORM);
    }
  };

  const getSectionStatus = (section: SectionKey, dirty: boolean) => {
    if (dirty) {
      return "Unsaved changes";
    }
    const savedAt = savedSections[section];
    if (savedAt && Date.now() - savedAt < SAVE_STATUS_TIMEOUT) {
      return "Saved";
    }
    return null;
  };

  const markSectionSaved = (section: SectionKey) => {
    setSavedSections((prev) => ({ ...prev, [section]: Date.now() }));
    setTimeout(() => {
      setSavedSections((prev) => ({ ...prev, [section]: 0 }));
    }, SAVE_STATUS_TIMEOUT);
  };

  const requiresWalrusSubscription = (section: SectionKey) =>
    section === "coverImage" || section === "details";

  const toggleSectionEditing = (section: SectionKey, nextValue?: boolean) => {
    setEditingSections((prev) => ({
      ...prev,
      [section]: typeof nextValue === "boolean" ? nextValue : !prev[section],
    }));
  };

  const handleEditToggle = (section: SectionKey) => {
    if (requiresWalrusSubscription(section) && mediaSectionDisabled) {
      return;
    }

    const isEditing = editingSections[section];

    if (!isEditing && requiresWalrusSubscription(section)) {
      setPendingWalrusSection(section);
      return;
    }

    toggleSectionEditing(section);
  };

  const handleConfirmWalrusEdit = () => {
    if (!pendingWalrusSection) {
      return;
    }
    toggleSectionEditing(pendingWalrusSection, true);
    setPendingWalrusSection(null);
  };

  const handleCloseWalrusModal = () => {
    setPendingWalrusSection(null);
  };

  const onSubmit = async (values: EditCampaignFormData) => {
    if (!ownerCapId) {
      toast.error(
        "Missing campaign owner capability. Connect the correct wallet and try again.",
      );
      return;
    }

    const {
      basicsUpdates,
      metadataPatch,
      hasBasicsChanges,
      hasMetadataChanges,
      shouldUploadWalrus,
    } = transformEditCampaignFormData({
      values,
      dirtyFields,
      campaign: campaignData,
      initialDescription,
    });

    const metadataUpdates = { ...metadataPatch };
    const walrusChanges = shouldUploadWalrus;

    if (!hasBasicsChanges && !hasMetadataChanges && !walrusChanges) {
      toast.info("No changes detected.");
      return;
    }

    if (walrusChanges && !storageRegistrationComplete) {
      toast.error(
        "Complete Walrus storage registration before publishing updates.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (walrusChanges && storageRegistrationComplete && walrusCertifyResult) {
        metadataUpdates.walrus_quilt_id = walrusCertifyResult.blobId;
        metadataUpdates.walrus_storage_epochs =
          walrusCertifyResult.storageEpochs.toString();
        metadataUpdates.cover_image_id = "cover.jpg";
      }

      const metadataKeys = Object.keys(metadataUpdates).filter(
        (key) =>
          metadataUpdates[key as keyof typeof metadataUpdates] !== undefined,
      );

      const hasMetadataPayload = metadataKeys.length > 0;

      if (hasBasicsChanges && hasMetadataPayload) {
        const tx = new Transaction();
        const nameArg = basicsUpdates.name
          ? tx.pure.option("string", basicsUpdates.name)
          : tx.pure.option("string", null);
        const descriptionArg = basicsUpdates.short_description
          ? tx.pure.option("string", basicsUpdates.short_description)
          : tx.pure.option("string", null);

        tx.moveCall({
          target: `${config.contracts.packageId}::campaign::update_campaign_basics`,
          arguments: [
            tx.object(campaignData.id),
            tx.object(ownerCapId),
            nameArg,
            descriptionArg,
            tx.object(CLOCK_OBJECT_ID),
          ],
        });

        const metadataValues = metadataKeys.map(
          (key) =>
            metadataUpdates[key as keyof typeof metadataUpdates] as string,
        );

        tx.moveCall({
          target: `${config.contracts.packageId}::campaign::update_campaign_metadata`,
          arguments: [
            tx.object(campaignData.id),
            tx.object(ownerCapId),
            tx.pure.vector("string", metadataKeys),
            tx.pure.vector("string", metadataValues),
            tx.object(CLOCK_OBJECT_ID),
          ],
        });

        await signAndExecuteTransaction({ transaction: tx });
      } else if (hasBasicsChanges) {
        await updateBasics(campaignData.id, ownerCapId, basicsUpdates);
      } else if (hasMetadataPayload) {
        await updateMetadata(campaignData.id, ownerCapId, metadataUpdates);
      }

      if (campaignNameDirty) {
        markSectionSaved("campaignName");
      }
      if (descriptionDirty) {
        markSectionSaved("description");
      }
      if (coverImageDirty || walrusChanges) {
        markSectionSaved("coverImage");
      }
      if (detailsDirty || storageEpochsDirty || walrusChanges) {
        markSectionSaved("details");
      }
      if (campaignTypeDirty) {
        markSectionSaved("campaignType");
      }
      if (categoriesDirty) {
        markSectionSaved("categories");
      }
      if (socialsDirty) {
        markSectionSaved("socials");
      }

      if (walrusChanges && storageRegistrationComplete && walrusCertifyResult) {
        const normalizedDetails = normalizeSerializedEditorStateString(
          values.campaignDetails ?? "",
        );
        setInitialDescription(normalizedDetails);
        setDescriptionInstanceKey((prev) => prev + 1);
        walrusBaselineRef.current = currentWalrusSnapshot;
        resetWalrusState();
        resetStorageEstimate();
      }

      setEditingSections({
        campaignName: false,
        description: false,
        coverImage: false,
        details: false,
        campaignType: false,
        categories: false,
        socials: false,
      });

      const currentValues = form.getValues();
      initialValuesRef.current = currentValues;
      form.reset(currentValues);

      await refetchCampaign();
      toast.success("Campaign updated successfully.");
      setInitialized(false);
      navigate(campaignDetailPath);
    } catch (error) {
      const abortCode = extractMoveAbortCode(error);
      if (abortCode !== null) {
        toast.error(mapCampaignError(abortCode));
      } else {
        toast.error(
          error instanceof Error ? error.message : "Failed to update campaign.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = form.handleSubmit(onSubmit, () => {
    scrollToFirstInvalidField();
  });

  const disableSubmit =
    isSubmitting || requireWalrusRegistration || !hasAnyChanges;

  const sectionStatuses: Record<SectionKey, string | null> = {
    campaignName: getSectionStatus("campaignName", campaignNameDirty),
    description: getSectionStatus("description", descriptionDirty),
    coverImage: getSectionStatus("coverImage", coverImageDirty),
    details: getSectionStatus("details", detailsDirty || storageEpochsDirty),
    campaignType: "Can't Edit",
    categories: getSectionStatus("categories", categoriesDirty),
    socials: getSectionStatus("socials", socialsDirty),
  };

  const FieldStatusBadge = ({ status }: { status: string | null }) =>
    status ? (
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {status}
      </span>
    ) : null;

  const renderEditButton = (section: SectionKey) => {
    const isEditing = editingSections[section];
    const shouldDisable =
      !isEditing && requiresWalrusSubscription(section) && mediaSectionDisabled;

    return (
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => handleEditToggle(section)}
        disabled={shouldDisable}
        aria-pressed={isEditing}
      >
        {isEditing ? (
          "Done"
        ) : (
          <div className="flex items-center gap-2">
            <PencilLineIcon className="size-4" />
            Edit
          </div>
        )}
      </Button>
    );
  };

  const walrusBalanceDisplay = isLoadingWalBalance
    ? "Loading..."
    : formattedBalance;
  const hasInsufficientWalBalance =
    Boolean(costEstimate) &&
    !isLoadingWalBalance &&
    BigInt(Math.floor((costEstimate?.subsidizedTotalCost ?? 0) * 10 ** 9)) >
      BigInt(walBalanceRaw || "0");

  const findFocusableDescendant = (element?: HTMLElement | null) => {
    if (!element) return null;

    const selector =
      "input, select, textarea, button, [tabindex]:not([tabindex='-1']), a[href]";

    if (
      element.matches(selector) &&
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true"
    ) {
      return element;
    }

    return element.querySelector<HTMLElement>(selector);
  };

  const getFirstInvalidField = () =>
    REQUIRED_FIELD_ORDER.find(
      (fieldName) => form.getFieldState(fieldName).invalid,
    );

  const scrollToFirstInvalidField = () => {
    const firstErrorField = getFirstInvalidField();

    if (!firstErrorField) {
      return;
    }

    window.requestAnimationFrame(() => {
      const targetElement =
        document.querySelector<HTMLElement>(
          `[data-field-error="${firstErrorField}"]`,
        ) ||
        document.querySelector<HTMLElement>(`[name="${firstErrorField}"]`) ||
        document.getElementById(firstErrorField);

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }

      const focusTarget = findFocusableDescendant(targetElement);

      if (focusTarget) {
        focusTarget.focus({ preventScroll: true });
      } else {
        form.setFocus(firstErrorField as Path<EditCampaignFormData>, {
          shouldSelect: true,
        });
      }
    });
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
    : walrusChangesDetected
      ? [
          { label: "Campaign metadata", amount: AUTO_CALCULATING_LABEL },
          { label: "Cover image", amount: AUTO_CALCULATING_LABEL },
          { label: "Campaign description", amount: AUTO_CALCULATING_LABEL },
          { label: "Storage epoch", amount: AUTO_CALCULATING_LABEL },
        ]
      : [
          {
            label: "Walrus storage status",
            amount: storageRegistrationComplete ? "Registered" : "No changes",
          },
        ];

  const totalCostDisplay = costEstimate
    ? `${costEstimate.subsidizedTotalCost.toFixed(6)} WAL`
    : storageRegistrationComplete
      ? "Registered"
      : walrusChangesDetected
        ? AUTO_CALCULATING_LABEL
        : "—";

  const canInteractWithWalrusSection =
    editingSections.details || walrusChangesDetected;
  const shouldHideRegisterButton =
    !walrusChangesDetected || Boolean(certifyRejectionMessage);
  const isWalrusOperationPending =
    walrus.prepare.isPending ||
    walrus.register.isPending ||
    walrus.upload.isPending ||
    walrus.certify.isPending;

  return (
    <>
      <CampaignCreationModal
        isOpen={modal.isOpen}
        currentStep={
          modal.currentStep ??
          (wizardStep !== WizardStep.FORM ? wizardStep : null)
        }
        onClose={handleModalClose}
        onConfirmRegister={handleConfirmRegisterStorage}
        onCancelRegister={handleCancelRegister}
        onRetry={handleWalrusModalRetry}
        estimatedCost={costEstimate}
        uploadProgress={uploadCompleted ? 100 : 0}
        errorTitle={walrusErrorTitle ?? undefined}
        error={walrusError?.message ?? undefined}
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
                <BreadcrumbPage>Edit campaign</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="container px-4 flex justify-center">
          <div className="w-full max-w-3xl px-4">
            <Form {...form}>
              <form className="flex flex-col gap-16" onSubmit={handleSubmit}>
                <div className="flex flex-col items-center text-center gap-4">
                  <h1 className="text-5xl font-bold">
                    Edit{" "}
                    <span className="text-primary">{campaignData.name}</span>{" "}
                    Campaign
                  </h1>
                  <p>
                    Any updates to campaign details may incur extra storage
                    fees. Please review the fields and update them as needed.
                  </p>
                </div>

                {walrusWarningVisible ? (
                  <Alert className="border-yellow-500 bg-yellow-50">
                    <AlertDescription className="flex flex-col gap-3 text-yellow-800">
                      <span className="font-semibold">
                        Unable to load Walrus content
                      </span>
                      <span className="text-sm">
                        We couldn’t load the campaign media from Walrus. You can
                        still edit basics and metadata, but media sections stay
                        disabled until the content loads.
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleRetryWalrus}
                        >
                          Retry
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setWalrusErrorAcknowledged(true)}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : null}

                <section className="flex flex-col mb-12 gap-8">
                  <h2 className="text-2xl font-semibold">Campaign Details</h2>

                  <FormField
                    control={form.control}
                    name="campaignName"
                    render={({ field }) => (
                      <FormItem
                        className="flex flex-col gap-4"
                        data-field-error="campaignName"
                      >
                        <div className="flex items-center justify-between">
                          <FormLabel
                            className="font-medium text-base"
                            htmlFor="edit-campaign-name"
                          >
                            Title <span className="text-red-300">*</span>
                          </FormLabel>
                          <div className="flex items-center gap-3">
                            <FieldStatusBadge
                              status={sectionStatuses.campaignName}
                            />
                            {renderEditButton("campaignName")}
                          </div>
                        </div>
                        <FormControl>
                          <Input
                            id="edit-campaign-name"
                            placeholder="Enter your campaign name"
                            {...field}
                            disabled={!editingSections.campaignName}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem
                        className="flex flex-col gap-4"
                        data-field-error="description"
                      >
                        <div className="flex items-center justify-between">
                          <FormLabel
                            className="font-medium text-base"
                            htmlFor="edit-campaign-description"
                          >
                            Short description{" "}
                            <span className="text-red-300">*</span>
                          </FormLabel>
                          <div className="flex items-center gap-3">
                            <FieldStatusBadge
                              status={sectionStatuses.description}
                            />
                            {renderEditButton("description")}
                          </div>
                        </div>
                        <FormControl>
                          <Textarea
                            id="edit-campaign-description"
                            placeholder="Brief description of your campaign"
                            rows={4}
                            {...field}
                            disabled={!editingSections.description}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium text-base">
                        Sub-name <span className="text-red-300">*</span>
                      </Label>
                      <FieldStatusBadge status="Can't Edit" />
                    </div>
                    <Input
                      value={formattedSubdomain}
                      disabled
                      readOnly
                      placeholder="yourcampaign"
                    />
                  </div>

                  <CampaignCoverImageUpload
                    disabled={!editingSections.coverImage}
                    initialPreviewUrl={coverImagePreviewUrl}
                    labelStatus={
                      <FieldStatusBadge status={sectionStatuses.coverImage} />
                    }
                    labelAction={renderEditButton("coverImage")}
                  />
                </section>

                <Separator />

                <div className="flex flex-col gap-2">
                  <CampaignTypeSelector
                    disabled
                    headerStatus={<FieldStatusBadge status="Can't Edit" />}
                    headerAction={null}
                  />
                  <p className="text-sm text-muted-foreground">
                    Platform payout policies are set when the campaign is
                    created. Launch a new campaign if you need a different
                    preset.
                  </p>
                </div>

                <CampaignCategorySelector
                  disabled={!editingSections.categories}
                  headerStatus={
                    <FieldStatusBadge status={sectionStatuses.categories} />
                  }
                  headerAction={renderEditButton("categories")}
                />

                <Separator />

                <section className="flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Funding Duration</h2>
                    <FieldStatusBadge status="Can't Edit" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Funding duration cannot be edited after launch. These dates
                    were set when the campaign was created.
                  </p>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label className="font-medium text-base">
                        Start date
                      </Label>
                      <Input
                        value={formattedStartDate}
                        disabled
                        readOnly
                        placeholder="Select start date"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="font-medium text-base">End date</Label>
                      <Input
                        value={formattedEndDate}
                        disabled
                        readOnly
                        placeholder="Select end date"
                      />
                    </div>
                  </div>
                </section>

                <section className="flex flex-col gap-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Funding Target</h2>
                    <FieldStatusBadge status="Can't Edit" />
                  </div>
                  <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-2">
                      <Label className="font-medium text-base">
                        Enter your campaign's goal amount
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#737373]" />
                        <Input
                          value={formattedFundingGoal}
                          disabled
                          readOnly
                          placeholder="Enter amount"
                          className="pl-12"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="font-medium text-base">
                        Add a funding Sui address
                      </Label>
                      <Input
                        value={formattedRecipientAddress}
                        disabled
                        readOnly
                        placeholder="0x8894E0a0c962CB723c1976a4421c95949bE2D4E3"
                      />
                      <p className="font-normal text-xs text-black-200">
                        This is the address that will receive all the payments.
                      </p>
                    </div>
                  </div>
                </section>

                <Separator />

                <section className="flex flex-col gap-8 mb-12">
                  <h2 className="text-2xl font-semibold">Additional Details</h2>

                  <FormField
                    control={form.control}
                    name="socials"
                    render={() => (
                      <FormItem data-field-error="socials">
                        <CampaignSocialsSection
                          disabled={!editingSections.socials}
                          labelStatus={
                            <FieldStatusBadge
                              status={sectionStatuses.socials}
                            />
                          }
                          labelAction={renderEditButton("socials")}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col gap-6">
                    <CampaignDetailsEditor
                      disabled={!editingSections.details}
                      instanceKey={descriptionInstanceKey}
                      labelStatus={
                        <FieldStatusBadge status={sectionStatuses.details} />
                      }
                      labelAction={renderEditButton("details")}
                    />
                    <CampaignStorageRegistrationCard
                      costs={storageCosts}
                      totalCost={totalCostDisplay}
                      isCalculating={isEstimatingStorage}
                      onRegister={handleRegisterStorage}
                      isPreparing={isWalrusOperationPending}
                      walBalance={walrusBalanceDisplay}
                      hasInsufficientBalance={hasInsufficientWalBalance}
                      requiredWalAmount={costEstimate?.subsidizedTotalCost}
                      hideRegisterButton={shouldHideRegisterButton}
                      isLocked={!canInteractWithWalrusSection}
                      disabled={!canInteractWithWalrusSection}
                      storageRegistered={storageRegistrationComplete}
                      selectedEpochs={selectedEpochs}
                      onEpochsChange={(value) =>
                        form.setValue("storageEpochs", value, {
                          shouldDirty: true,
                        })
                      }
                      certifyErrorMessage={certifyRejectionMessage}
                      onRetryCertify={handleRetryCertify}
                      isRetryingCertify={walrus.certify.isPending}
                      estimatedCost={costEstimate ?? null}
                    />
                  </div>
                </section>

                <Separator />

                <section className="flex flex-col gap-6">
                  <Alert>
                    <AlertDescription className="flex items-center gap-2">
                      <AlertCircleIcon className="size-4" />
                      Publishing updates requires a Sui transaction. Review your
                      edits before proceeding.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      size="lg"
                      className="min-w-[168px]"
                      disabled={disableSubmit || isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "Publish Update"}
                    </Button>
                  </div>
                </section>

                <WalrusReuploadWarningModal
                  open={pendingWalrusSection !== null}
                  onConfirm={handleConfirmWalrusEdit}
                  onClose={handleCloseWalrusModal}
                />
              </form>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
}
