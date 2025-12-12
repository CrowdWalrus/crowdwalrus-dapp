import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { toast } from "sonner";

import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { ROUTES } from "@/shared/config/routes";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { ProfileAvatarUpload } from "@/features/profiles/components/ProfileAvatarUpload";
import {
  createProfileSchema,
  type CreateProfileFormData,
} from "@/features/profiles/schemas/createProfileSchema";
// TODO: Re-enable suiNS subname registration once Move profile supports subname registration.
// import { SubnameField } from "@/features/suins/components/SubnameField";
import {
  CampaignSocialsSection,
  CampaignStorageRegistrationCard,
  type StorageCost,
} from "@/features/campaigns/components/new-campaign";
import {
  DEFAULT_NETWORK,
  PROFILE_AVATAR_STORAGE_DEFAULT_EPOCHS,
  useNetworkVariable,
  WALRUS_EPOCH_CONFIG,
} from "@/shared/config/networkConfig";
import { useWalBalance } from "@/shared/hooks/useWalBalance";
import {
  sanitizeSocialLinks,
  serializeSocialLinks,
  parseSocialLinksFromMetadata,
} from "@/features/campaigns/utils/socials";
import { useProfile } from "@/features/profiles/hooks/useProfile";
import {
  PROFILE_METADATA_KEYS,
  PROFILE_METADATA_REMOVED_VALUE,
} from "@/features/profiles/constants/metadata";
import {
  createProfile,
  updateProfileMetadata,
  type ProfileMetadataUpdate,
} from "@/services/profile";
import { isUserRejectedError } from "@/shared/utils/errors";
import { formatSubdomain } from "@/shared/utils/subdomain";
import { buildProfileDetailPath } from "@/shared/utils/routes";
import {
  CampaignCreationModal,
  useCampaignCreationModal,
} from "@/features/campaigns/components/campaign-creation-modal";
import {
  useWalrusUpload,
  type CertifyResult,
  type RegisterResult,
  type WalrusFlowState,
} from "@/features/campaigns/hooks/useWalrusUpload";
import type { StorageCostEstimate } from "@/features/campaigns/types/campaign";
import { getWalrusUrl } from "@/services/walrus";
import { WizardStep } from "@/features/campaigns/types/campaign";
import { useEstimateProfileAvatarCost } from "@/features/profiles/hooks/useProfileAvatarStorage";

const DEFAULT_VALUES: CreateProfileFormData = {
  profileImage: null,
  fullName: "",
  email: "",
  subdomain: "",
  bio: "",
  socials: [],
};

const PROFILE_FORM_KEYS = {
  fullName: PROFILE_METADATA_KEYS.FULL_NAME,
  email: PROFILE_METADATA_KEYS.EMAIL,
  bio: PROFILE_METADATA_KEYS.BIO,
  subdomain: PROFILE_METADATA_KEYS.SUBDOMAIN,
  socials: PROFILE_METADATA_KEYS.SOCIALS_JSON,
  avatar: PROFILE_METADATA_KEYS.AVATAR_WALRUS_ID,
};

const PROFILE_REFETCH_ATTEMPTS = 4;
const PROFILE_REFETCH_DELAY_MS = 1000;
const METADATA_PROPAGATION_ATTEMPTS = 6;
const METADATA_PROPAGATION_DELAY_MS = 800;
const STORAGE_PENDING_LABEL = "Upload an image to calculate";
const AUTO_CALCULATING_LABEL = "Calculating...";

const buildAvatarFileKey = (file: File) =>
  `${file.name ?? "file"}-${file.size}-${file.lastModified}`;

function extractSubdomainLabel(
  storedValue: string | undefined,
  campaignDomain: string | null,
) {
  if (!storedValue || !campaignDomain) {
    return storedValue ?? "";
  }
  const suffix = `.${campaignDomain}`;
  return storedValue.endsWith(suffix)
    ? storedValue.slice(0, storedValue.length - suffix.length)
    : storedValue;
}

function formatProfileSubdomain(value: string, campaignDomain: string | null) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return "";
  }
  if (!campaignDomain) {
    return trimmed;
  }
  return formatSubdomain(trimmed, campaignDomain);
}

function addMetadataUpdate(
  updates: ProfileMetadataUpdate[],
  key: string,
  nextValue: string,
  currentMetadata: Record<string, string>,
  rawMetadata: Record<string, string>,
) {
  const normalizedNext = nextValue.trim();
  const rawValue = rawMetadata[key];

  if (!normalizedNext) {
    const hasStoredValue =
      typeof rawValue === "string" &&
      rawValue.length > 0 &&
      rawValue !== PROFILE_METADATA_REMOVED_VALUE;

    if (hasStoredValue) {
      updates.push({
        key,
        value: PROFILE_METADATA_REMOVED_VALUE,
      });
    }
    return;
  }

  if ((currentMetadata[key] ?? "") === normalizedNext) {
    return;
  }

  updates.push({ key, value: normalizedNext });
}

function buildProfileMetadataUpdates(
  values: CreateProfileFormData,
  currentMetadata: Record<string, string>,
  rawMetadata: Record<string, string>,
  campaignDomain: string | null,
  avatarWalrusUrl?: string | null,
  removeAvatar = false,
) {
  const updates: ProfileMetadataUpdate[] = [];

  addMetadataUpdate(
    updates,
    PROFILE_FORM_KEYS.fullName,
    values.fullName.trim(),
    currentMetadata,
    rawMetadata,
  );

  const normalizedEmail = values.email.trim().toLowerCase();
  addMetadataUpdate(
    updates,
    PROFILE_FORM_KEYS.email,
    normalizedEmail,
    currentMetadata,
    rawMetadata,
  );

  addMetadataUpdate(
    updates,
    PROFILE_FORM_KEYS.bio,
    values.bio.trim(),
    currentMetadata,
    rawMetadata,
  );

  const formattedSubdomain = formatProfileSubdomain(
    values.subdomain,
    campaignDomain,
  );
  addMetadataUpdate(
    updates,
    PROFILE_FORM_KEYS.subdomain,
    formattedSubdomain,
    currentMetadata,
    rawMetadata,
  );

  const sanitizedSocials = sanitizeSocialLinks(values.socials);
  const socialsJson = serializeSocialLinks(sanitizedSocials);
  addMetadataUpdate(
    updates,
    PROFILE_FORM_KEYS.socials,
    socialsJson,
    currentMetadata,
    rawMetadata,
  );

  // Only touch the avatar metadata when the user explicitly changed it
  // (new upload or removal). Previously we would pass an empty string when
  // `avatarWalrusUrl` was undefined, which caused the existing avatar to be
  // cleared whenever any other field was edited.
  if (removeAvatar) {
    addMetadataUpdate(
      updates,
      PROFILE_FORM_KEYS.avatar,
      "",
      currentMetadata,
      rawMetadata,
    );
  } else if (typeof avatarWalrusUrl === "string") {
    const normalizedAvatarUrl = avatarWalrusUrl.trim();

    addMetadataUpdate(
      updates,
      PROFILE_FORM_KEYS.avatar,
      normalizedAvatarUrl,
      currentMetadata,
      rawMetadata,
    );
  }

  return updates;
}

export default function CreateProfilePage() {
  useDocumentTitle("Create Profile");

  const form = useForm<CreateProfileFormData>({
    resolver: zodResolver(createProfileSchema),
    mode: "onChange",
    defaultValues: DEFAULT_VALUES,
  });

  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const campaignDomain = useNetworkVariable("campaignDomain") ?? null;
  const avatarStorageEpochs =
    (useNetworkVariable("avatarStorageEpochs") as number | undefined) ??
    PROFILE_AVATAR_STORAGE_DEFAULT_EPOCHS[DEFAULT_NETWORK];
  const modal = useCampaignCreationModal();
  const navigate = useNavigate();

  const { mutateAsync: signAndExecuteTransaction } =
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

  const profileImageValue = useWatch({
    control: form.control,
    name: "profileImage",
  });
  const lastProfileImageRef = useRef<File | null>(null);
  const redirectTimeoutRef = useRef<number | null>(null);

  const [selectedEpochs, setSelectedEpochs] =
    useState<number>(avatarStorageEpochs);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isRedirectingPostSave, setIsRedirectingPostSave] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>(WizardStep.FORM);
  const walrus = useWalrusUpload();
  const {
    mutate: estimateAvatarCost,
    mutateAsync: estimateAvatarCostAsync,
    isPending: isEstimatingAvatarCost,
    reset: resetAvatarCost,
  } = useEstimateProfileAvatarCost();
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
  const [pendingAvatarWalrusUrl, setPendingAvatarWalrusUrl] = useState<
    string | null
  >(null);
  const [avatarMarkedForRemoval, setAvatarMarkedForRemoval] =
    useState(false);
  const [walrusError, setWalrusError] = useState<Error | null>(null);
  const [avatarCostState, setAvatarCostState] = useState<{
    estimate: StorageCostEstimate | null;
    fileKey: string | null;
  }>({ estimate: null, fileKey: null });
  const isRegistrationPending =
    walrus.register.isPending ||
    walrus.upload.isPending ||
    walrus.certify.isPending;
  const hasCompletedStorageRegistration = Boolean(
    certifyResult && pendingAvatarWalrusUrl,
  );

  const handleCloseModal = () => {
    if (wizardStep === WizardStep.ERROR) {
      modal.closeModal();
      setWizardStep(WizardStep.FORM);
      setWalrusError(null);
      setCertifyRejectionMessage(null);
    }
  };

  const {
    formattedBalance,
    isLoading: isBalanceLoading,
    balance: walBalanceRaw,
  } = useWalBalance();
  const {
    profile,
    profileId,
    metadata,
    rawMetadata,
    hasProfile,
    isFetching: isProfileFetching,
    refetch: refetchProfileData,
  } = useProfile({
    ownerAddress: account?.address ?? null,
    enabled: Boolean(account?.address),
  });
  const lastInitializedProfileIdRef = useRef<string | null>(null);

  const hasProfileImage = profileImageValue instanceof File;
  const profileImageFile = hasProfileImage ? (profileImageValue as File) : null;
  const currentImageFileKey = profileImageFile
    ? buildAvatarFileKey(profileImageFile)
    : null;
  const avatarCostEstimate =
    avatarCostState.fileKey === currentImageFileKey
      ? avatarCostState.estimate
      : null;
  const isWalletConnected = Boolean(account?.address);

  useEffect(() => {
    const nextFile = hasProfileImage ? (profileImageValue as File) : null;

    if (nextFile === lastProfileImageRef.current) {
      return;
    }

    lastProfileImageRef.current = nextFile;

    setFlowState(null);
    setRegisterResult(null);
    setUploadCompleted(false);
    setCertifyResult(null);
    setPendingAvatarWalrusUrl(null);
    setAvatarMarkedForRemoval(false);
    setCertifyRejectionMessage(null);
    setWalrusError(null);
    setWizardStep(WizardStep.FORM);
  }, [hasProfileImage, profileImageValue]);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const profileStatusMessage = useMemo(() => {
    if (!isWalletConnected) {
      return "Connect your wallet to create or edit your Crowd Walrus profile.";
    }

    if (isProfileFetching) {
      return "Checking for an existing on-chain profile...";
    }

    if (profileId) {
      return "Updates will modify the on-chain metadata associated with this wallet.";
    }

    return "Submitting will mint a profile object on-chain for your wallet.";
  }, [isProfileFetching, isWalletConnected, profileId]);

  const submitButtonLabel = isSavingProfile
    ? "Saving..."
    : isRedirectingPostSave
      ? "Redirecting..."
      : profileId
        ? "Save Changes"
        : "Create Profile";

  const isFormReadOnly =
    isSavingProfile ||
    isRedirectingPostSave ||
    !isWalletConnected ||
    isProfileFetching;
  const dirtyFields = form.formState.dirtyFields;
  const hasBasicFieldChanges = Boolean(
    dirtyFields.fullName ||
      dirtyFields.email ||
      dirtyFields.bio ||
      dirtyFields.subdomain,
  );
  const socialsDirty = (() => {
    const value = dirtyFields.socials;
    if (Array.isArray(value)) {
      return value.some(Boolean);
    }
    return Boolean(value);
  })();
  const hasPendingChanges =
    !hasProfile ||
    hasBasicFieldChanges ||
    socialsDirty ||
    Boolean(pendingAvatarWalrusUrl) ||
    avatarMarkedForRemoval;
  const isSubmitDisabled = isFormReadOnly || !hasPendingChanges;
  const registrationDisabled =
    !hasProfileImage || isFormReadOnly || isRegistrationPending;

  const queryClient = useQueryClient();

  useEffect(() => {
    if (
      wizardStep === WizardStep.FORM ||
      wizardStep === WizardStep.CONFIRM_TX
    ) {
      modal.closeModal();
      return;
    }

    modal.openModal(wizardStep);
  }, [modal, wizardStep]);
  const storageCosts: StorageCost[] = avatarCostEstimate
    ? [
        {
          label: "Profile image size",
          amount: `${(
            avatarCostEstimate.breakdown.imagesSize /
            1024 /
            1024
          ).toFixed(2)} MB`,
        },
        {
          label: "Encoded size",
          amount: `${(avatarCostEstimate.encodedSize / 1024 / 1024).toFixed(
            2,
          )} MB`,
        },
        {
          label: `Storage (${avatarCostEstimate.epochs} epochs)`,
          amount: `${avatarCostEstimate.subsidizedStorageCost.toFixed(6)} WAL`,
        },
        {
          label: "Upload cost",
          amount: `${avatarCostEstimate.subsidizedUploadCost.toFixed(6)} WAL`,
        },
        ...(avatarCostEstimate.subsidyRate && avatarCostEstimate.subsidyRate > 0
          ? [
              {
                label: `Subsidy discount (${(
                  avatarCostEstimate.subsidyRate * 100
                ).toFixed(0)}%)`,
                amount: `-${(
                  avatarCostEstimate.totalCostWal -
                  avatarCostEstimate.subsidizedTotalCost
                ).toFixed(6)} WAL`,
              },
            ]
          : []),
      ]
    : [
        {
          label: "Profile image size",
          amount: hasProfileImage
            ? AUTO_CALCULATING_LABEL
            : STORAGE_PENDING_LABEL,
        },
        {
          label: "Encoded size",
          amount: hasProfileImage
            ? AUTO_CALCULATING_LABEL
            : STORAGE_PENDING_LABEL,
        },
        {
          label: "Storage epoch",
          amount: hasProfileImage
            ? AUTO_CALCULATING_LABEL
            : STORAGE_PENDING_LABEL,
        },
      ];

  const totalCost = avatarCostEstimate
    ? `${avatarCostEstimate.subsidizedTotalCost.toFixed(6)} WAL`
    : hasProfileImage
      ? AUTO_CALCULATING_LABEL
      : STORAGE_PENDING_LABEL;

  useEffect(() => {
    setSelectedEpochs((current) =>
      current === avatarStorageEpochs ? current : avatarStorageEpochs,
    );
  }, [avatarStorageEpochs]);

  const handleEpochsChange = (epochs: number) => {
    const config = WALRUS_EPOCH_CONFIG[DEFAULT_NETWORK];
    const clampedEpochs = Math.min(Math.max(1, epochs), config.maxEpochs);
    setSelectedEpochs(clampedEpochs);
  };

  useEffect(() => {
    if (!profileImageFile) {
      resetAvatarCost();
      setAvatarCostState({ estimate: null, fileKey: null });
      return;
    }

    const fileKey = buildAvatarFileKey(profileImageFile);
    setAvatarCostState({ estimate: null, fileKey });

    estimateAvatarCost(
      { file: profileImageFile, epochs: selectedEpochs },
      {
        onSuccess: (result) => {
          setAvatarCostState({ estimate: result, fileKey });
        },
      },
    );
  }, [estimateAvatarCost, profileImageFile, resetAvatarCost, selectedEpochs]);

  useEffect(() => {
    if (!profileId || !profile) {
      if (profileId === null && lastInitializedProfileIdRef.current !== null) {
        form.reset(DEFAULT_VALUES);
        lastInitializedProfileIdRef.current = null;
      }
      return;
    }

    if (lastInitializedProfileIdRef.current === profileId) {
      return;
    }

    const existingSocials = parseSocialLinksFromMetadata(
      profile.metadata ?? {},
    );

    form.reset({
      ...DEFAULT_VALUES,
      fullName: metadata[PROFILE_FORM_KEYS.fullName] ?? "",
      email: metadata[PROFILE_FORM_KEYS.email] ?? "",
      bio: metadata[PROFILE_FORM_KEYS.bio] ?? "",
      subdomain: extractSubdomainLabel(
        metadata[PROFILE_FORM_KEYS.subdomain],
        campaignDomain,
      ),
      socials: existingSocials,
      profileImage: null,
    });

    setPendingAvatarWalrusUrl(null);
    setFlowState(null);
    setRegisterResult(null);
    setUploadCompleted(false);
    setCertifyResult(null);
    setWizardStep(WizardStep.FORM);
    setWalrusError(null);
    setCertifyRejectionMessage(null);
    modal.closeModal();

    lastInitializedProfileIdRef.current = profileId;
  }, [campaignDomain, form, metadata, modal, profile, profileId]);

  const epochConfig = WALRUS_EPOCH_CONFIG[DEFAULT_NETWORK];
  const totalStorageDays = selectedEpochs * epochConfig.epochDurationDays;
  const registrationSummary = `Profile images are stored for ${selectedEpochs} epoch${
    selectedEpochs !== 1 ? "s" : ""
  } (~${totalStorageDays} day${totalStorageDays !== 1 ? "s" : ""}).`;
  const registrationHint =
    "Storage duration is automatically managed for avatars.";
  const hasInsufficientBalance = Boolean(
    avatarCostEstimate &&
      !isBalanceLoading &&
      BigInt(Math.floor(avatarCostEstimate.subsidizedTotalCost * 10 ** 9)) >
        BigInt(walBalanceRaw ?? "0"),
  );
  const storedAvatarWalrusValue =
    (metadata[PROFILE_FORM_KEYS.avatar] ?? "").trim() ?? "";
  const storedAvatarWalrusUrl =
    storedAvatarWalrusValue === PROFILE_METADATA_REMOVED_VALUE
      ? ""
      : storedAvatarWalrusValue;
  const shouldWarnOnAvatarReplace =
    Boolean(storedAvatarWalrusUrl) && !avatarMarkedForRemoval;
  const resolvedAvatarPreview = avatarMarkedForRemoval
    ? null
    : pendingAvatarWalrusUrl ?? storedAvatarWalrusUrl;
  const walrusBalanceDisplay = isBalanceLoading
    ? "Loading..."
    : formattedBalance;
  const rawErrorMessage = walrusError?.message ?? "";
  const isUploadError =
    !!walrusError &&
    registerResult !== null &&
    !uploadCompleted &&
    !certifyResult;
  const errorHeading = (() => {
    if (!walrusError) {
      return "";
    }
    if (isUploadError) {
      return "Upload failed";
    }
    return rawErrorMessage || "Something went wrong";
  })();
  const errorBody = (() => {
    if (!walrusError) {
      return "";
    }
    return rawErrorMessage;
  })();

  const waitForProfileId = useCallback(async () => {
    for (let attempt = 0; attempt < PROFILE_REFETCH_ATTEMPTS; attempt++) {
      const result = await refetchProfileData();
      const candidate = result.data?.profile?.profileId ?? null;
      if (candidate) {
        return candidate;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, PROFILE_REFETCH_DELAY_MS * (attempt + 1)),
      );
    }

    return null;
  }, [refetchProfileData]);

  const waitForMetadataPropagation = useCallback(
    async (updates: ProfileMetadataUpdate[]) => {
      if (!updates.length) {
        return true;
      }

      const expectedEntries = updates.map(({ key, value }) => ({
        key,
        expected:
          value === PROFILE_METADATA_REMOVED_VALUE ? "" : value.trim(),
      }));

      for (
        let attempt = 0;
        attempt < METADATA_PROPAGATION_ATTEMPTS;
        attempt++
      ) {
        const result = await refetchProfileData();
        const current = result.data?.profile?.metadata ?? {};

        const allMatch = expectedEntries.every(({ key, expected }) => {
          const currentValue =
            typeof current[key] === "string" ? current[key].trim() : "";
          return currentValue === expected;
        });

        if (allMatch) {
          return true;
        }

        await new Promise((resolve) =>
          setTimeout(resolve, METADATA_PROPAGATION_DELAY_MS * (attempt + 1)),
        );
      }

      return false;
    },
    [refetchProfileData],
  );

  const startCertifyFlow = useCallback(
    (state: WalrusFlowState | null) => {
      if (!state || walrus.certify.isPending) {
        return;
      }

      setWizardStep(WizardStep.CERTIFYING);
      setWalrusError(null);
      setCertifyRejectionMessage(null);

      walrus.certify.mutate(state, {
        onSuccess: (result) => {
          setCertifyResult(result);
          const identifier =
            state.context?.profileAvatarIdentifier ?? "avatar.jpg";
          const walrusUrl = getWalrusUrl(
            result.blobId,
            state.network,
            identifier,
          );
          setPendingAvatarWalrusUrl(walrusUrl);
          setWizardStep(WizardStep.FORM);
          modal.closeModal();
          toast.success(
            "Profile image stored on Walrus. Save to update your profile.",
          );
        },
        onError: (error) => {
          if (isUserRejectedError(error)) {
            setCertifyRejectionMessage(
              "Approve the certification transaction in your wallet to continue.",
            );
            setWizardStep(WizardStep.FORM);
            modal.closeModal();
            return;
          }

          setWalrusError(
            error instanceof Error
              ? error
              : new Error("Failed to certify Walrus storage."),
          );
          setWizardStep(WizardStep.ERROR);
        },
      });
    },
    [modal, walrus.certify],
  );

  const executeUpload = useCallback(
    (result: RegisterResult) => {
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
          onError: (error) => {
            setWalrusError(
              error instanceof Error
                ? error
                : new Error("Failed to upload profile image to Walrus."),
            );
            setWizardStep(WizardStep.ERROR);
          },
        },
      );
    },
    [startCertifyFlow, walrus.upload],
  );

  const handleRegisterStorageClick = useCallback(async () => {
    if (!profileImageFile) {
      toast.error("Upload a profile image before registering storage.");
      return;
    }

    if (!account?.address) {
      toast.error("Connect your wallet to register Walrus storage.");
      return;
    }

    const isValid = await form.trigger("profileImage");
    if (!isValid) {
      return;
    }

    try {
      const fileKey = buildAvatarFileKey(profileImageFile);
      if (avatarCostState.fileKey !== fileKey || !avatarCostEstimate) {
        const freshEstimate = await estimateAvatarCostAsync({
          file: profileImageFile,
          epochs: selectedEpochs,
        });
        setAvatarCostState({ estimate: freshEstimate, fileKey });
      }

      walrus.prepare.mutate(
        {
          purpose: "profile-avatar",
          avatar: profileImageFile,
          network: DEFAULT_NETWORK,
          storageEpochs: selectedEpochs,
        },
        {
          onSuccess: (flow) => {
            setFlowState(flow);
            setWizardStep(WizardStep.CONFIRM_REGISTER);
          },
          onError: (error) => {
            setWalrusError(
              error instanceof Error
                ? error
                : new Error("Failed to prepare profile image upload."),
            );
            setWizardStep(WizardStep.ERROR);
          },
        },
      );
    } catch (error) {
      setWalrusError(
        error instanceof Error
          ? error
          : new Error("Failed to estimate storage cost."),
      );
      setWizardStep(WizardStep.ERROR);
    }
  }, [
    account?.address,
    avatarCostEstimate,
    avatarCostState.fileKey,
    estimateAvatarCostAsync,
    form,
    profileImageFile,
    selectedEpochs,
    setAvatarCostState,
    walrus.prepare,
  ]);

  const handleCancelRegister = useCallback(() => {
    setWizardStep(WizardStep.FORM);
    setCertifyRejectionMessage(null);
    modal.closeModal();
  }, [modal]);

  const handleConfirmRegister = useCallback(() => {
    if (!flowState) {
      toast.error("Prepare the profile image upload before continuing.");
      return;
    }

    setWizardStep(WizardStep.REGISTERING);
    setWalrusError(null);
    setCertifyRejectionMessage(null);

    walrus.register.mutate(flowState, {
      onSuccess: (result) => {
        setRegisterResult(result);
        setWizardStep(WizardStep.UPLOADING);
        executeUpload(result);
      },
      onError: (error) => {
        setWalrusError(
          error instanceof Error
            ? error
            : new Error("Failed to register storage on Walrus."),
        );
        setWizardStep(WizardStep.ERROR);
      },
    });
  }, [executeUpload, flowState, walrus.register]);

  const handleRetryUpload = useCallback(() => {
    if (!registerResult) {
      return;
    }

    setWizardStep(WizardStep.UPLOADING);
    setWalrusError(null);
    setCertifyRejectionMessage(null);
    executeUpload(registerResult);
  }, [executeUpload, registerResult]);

  const handleRetryCertify = useCallback(() => {
    if (registerResult) {
      startCertifyFlow(registerResult.flowState);
      return;
    }

    if (flowState) {
      startCertifyFlow(flowState);
    }
  }, [flowState, registerResult, startCertifyFlow]);

  const handleRetry = useCallback(() => {
    setWalrusError(null);

    if (registerResult && !uploadCompleted) {
      handleRetryUpload();
      return;
    }

    if (registerResult && uploadCompleted) {
      startCertifyFlow(registerResult.flowState);
      return;
    }

    if (flowState) {
      setWizardStep(WizardStep.CONFIRM_REGISTER);
      return;
    }

    setWizardStep(WizardStep.FORM);
  }, [
    flowState,
    handleRetryUpload,
    registerResult,
    startCertifyFlow,
    uploadCompleted,
  ]);

  const handleAvatarRemove = useCallback(() => {
    setPendingAvatarWalrusUrl(null);
    setAvatarMarkedForRemoval(true);
    setFlowState(null);
    setRegisterResult(null);
    setUploadCompleted(false);
    setCertifyResult(null);
    setCertifyRejectionMessage(null);
    setWalrusError(null);
    setWizardStep(WizardStep.FORM);
    lastProfileImageRef.current = null;
    form.setValue("profileImage", null, { shouldDirty: true });
  }, [form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!account?.address) {
      toast.error("Connect your wallet to create a profile.");
      return;
    }

    const imageDirty = Boolean(form.formState.dirtyFields.profileImage);
    if (imageDirty && !pendingAvatarWalrusUrl && !avatarMarkedForRemoval) {
      toast.error(
        "Complete the Walrus storage steps for your new profile image before saving.",
      );
      return;
    }

    const updates = buildProfileMetadataUpdates(
      values,
      metadata,
      rawMetadata,
      campaignDomain,
      pendingAvatarWalrusUrl ?? undefined,
      avatarMarkedForRemoval,
    );

    if (updates.length === 0 && hasProfile) {
      toast.info("Your profile is already up to date.");
      return;
    }

    setIsSavingProfile(true);
    const existedBeforeSubmit = Boolean(profileId);

    try {
      let targetProfileId = profileId ?? null;

      if (!targetProfileId) {
        const latest = await refetchProfileData();
        targetProfileId = latest.data?.profile?.profileId ?? null;
      }

      if (!targetProfileId) {
        const createTx = createProfile(DEFAULT_NETWORK);
        await signAndExecuteTransaction({
          transaction: createTx,
          chain: `sui:${DEFAULT_NETWORK}`,
        });

        targetProfileId = await waitForProfileId();
        if (!targetProfileId) {
          throw new Error(
            "Profile creation succeeded, but the profile object is still propagating. Please try again in a moment.",
          );
        }
      }

      if (updates.length > 0) {
        const updateTx = updateProfileMetadata(
          targetProfileId,
          updates,
          DEFAULT_NETWORK,
        );
        await signAndExecuteTransaction({
          transaction: updateTx,
          chain: `sui:${DEFAULT_NETWORK}`,
        });
      }

      await refetchProfileData();

      // Poll until the indexer reflects all metadata updates so the profile page
      // shows fresh data immediately after redirect.
      await waitForMetadataPropagation(updates);

      // Force downstream profile consumers (e.g., ProfilePage) to fetch fresh
      // metadata immediately so the new values show without a manual reload.
      await queryClient.invalidateQueries({ queryKey: ["indexer", "profile"] });

      // Clear the local profile image field so future saves aren't blocked by
      // a stale File reference that no longer needs Walrus registration.
      form.resetField("profileImage", { defaultValue: null });
      lastProfileImageRef.current = null;

      const actionMessage =
        updates.length === 0
          ? "Profile created successfully."
          : existedBeforeSubmit
            ? "Profile updated successfully."
            : "Profile created and updated successfully.";

      toast.success(actionMessage);
      if (account?.address) {
        setIsRedirectingPostSave(true);
        if (redirectTimeoutRef.current !== null) {
          window.clearTimeout(redirectTimeoutRef.current);
        }
        redirectTimeoutRef.current = window.setTimeout(() => {
          navigate(buildProfileDetailPath(account.address));
        }, 2500);
      }
      setPendingAvatarWalrusUrl(null);
      setAvatarMarkedForRemoval(false);
      setRegisterResult(null);
      setCertifyResult(null);
      setFlowState(null);
      setUploadCompleted(false);
      setWizardStep(WizardStep.FORM);
      setWalrusError(null);
      setCertifyRejectionMessage(null);
    } catch (error) {
      if (isUserRejectedError(error)) {
        toast.info("Transaction cancelled. No changes were made.");
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "Failed to save your profile. Please try again.";
      toast.error(message);
    } finally {
      setIsSavingProfile(false);
    }
  });

  return (
    <FormProvider {...form}>
      <CampaignCreationModal
        isOpen={modal.isOpen}
        currentStep={modal.currentStep}
        onClose={handleCloseModal}
        onConfirmRegister={handleConfirmRegister}
        onCancelRegister={handleCancelRegister}
        onRetry={handleRetry}
        estimatedCost={avatarCostEstimate}
        uploadProgress={uploadCompleted ? 100 : 0}
        errorTitle={errorHeading || undefined}
        error={errorBody || rawErrorMessage || undefined}
        processingMessage={
          wizardStep === WizardStep.CERTIFYING
            ? "Certifying profile image storage..."
            : undefined
        }
        mode="profile"
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
                <BreadcrumbPage>Create Profile</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="container px-4 flex justify-center">
          <div className="w-full max-w-3xl px-4">
            <Form {...form}>
              <form onSubmit={handleSubmit} className="flex flex-col gap-12">
                <header className="flex flex-col items-center gap-4 text-center">
                  <h1 className="text-4xl font-bold">Create Profile</h1>
                </header>

                <Alert>
                  <AlertDescription>{profileStatusMessage}</AlertDescription>
                </Alert>

                <Card className="border-black-50 bg-white">
                  <CardContent className="flex flex-col gap-10 p-6 sm:py-8 sm:px-6">
                    <ProfileAvatarUpload
                      disabled={isFormReadOnly}
                      initialPreviewUrl={
                        resolvedAvatarPreview &&
                        resolvedAvatarPreview.length > 0
                          ? resolvedAvatarPreview
                          : null
                      }
                      warnOnReupload={shouldWarnOnAvatarReplace}
                      onAvatarRemove={handleAvatarRemove}
                      isMarkedForRemoval={avatarMarkedForRemoval}
                    />

                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem className="flex flex-col gap-2">
                            <FormLabel className="font-medium text-base">
                              Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Add your full name"
                                disabled={isFormReadOnly}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="flex flex-col gap-2">
                            <FormLabel className="font-medium text-base">
                              Email
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Add your email address"
                                disabled={isFormReadOnly}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* TODO: Re-enable suiNS SubnameField once Move profile supports subname registration again. */}
                    {/*
                      <SubnameField
                        label="Setup your nick name"
                        placeholder="your-name"
                        disabled={isFormReadOnly}
                      />
                    */}

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel className="font-medium text-base">
                            Bio
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add something about yourself"
                              rows={4}
                              disabled={isFormReadOnly}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="socials"
                      render={() => (
                        <FormItem className="flex flex-col gap-2">
                          <CampaignSocialsSection disabled={isFormReadOnly} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <CampaignStorageRegistrationCard
                  costs={storageCosts}
                  totalCost={totalCost}
                  isCalculating={isEstimatingAvatarCost}
                  onRegister={handleRegisterStorageClick}
                  isPreparing={walrus.prepare.isPending}
                  walBalance={walrusBalanceDisplay}
                  hasInsufficientBalance={hasInsufficientBalance}
                  requiredWalAmount={avatarCostEstimate?.subsidizedTotalCost}
                  selectedEpochs={selectedEpochs}
                  onEpochsChange={handleEpochsChange}
                  disabled={registrationDisabled}
                  certifyErrorMessage={certifyRejectionMessage}
                  onRetryCertify={handleRetryCertify}
                  isRetryingCertify={walrus.certify.isPending}
                  storageRegistered={hasCompletedStorageRegistration}
                  estimatedCost={avatarCostEstimate}
                  disableEpochSelection
                  registrationPeriodSummary={registrationSummary}
                  registrationPeriodHint={registrationHint}
                  successDescription="You can now save your Crowd Walrus profile with this image."
                  successTitle="Profile image upload complete!"
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="lg"
                    className="min-w-[160px]"
                    disabled={isSubmitDisabled}
                  >
                    {submitButtonLabel}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
