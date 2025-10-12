import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useForm, type FieldNamesMarkedBoolean } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "sonner";

import { useCampaign } from "@/features/campaigns/hooks/useCampaign";
import { useOwnedCampaignCap } from "@/features/campaigns/hooks/useOwnedCampaignCap";
import { useWalrusUpload } from "@/features/campaigns/hooks/useWalrusUpload";
import {
  useUpdateCampaignBasics,
  useUpdateCampaignMetadata,
} from "@/features/campaigns/hooks/useCampaignMutations";
import {
  buildEditCampaignSchema,
  type EditCampaignFormData,
} from "@/features/campaigns/schemas/editCampaignSchema";
import { transformEditCampaignFormData } from "@/features/campaigns/utils/transformEditCampaignFormData";
import {
  mapCampaignError,
  extractMoveAbortCode,
} from "@/features/campaigns/utils/errorMapping";
import { getContractConfig, CLOCK_OBJECT_ID } from "@/shared/config/contracts";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import { ROUTES } from "@/shared/config/routes";
import {
  CampaignCoverImageUpload,
  CampaignDetailsEditor,
  CampaignTypeSelector,
  CampaignCategorySelector,
  CampaignSocialsSection,
  CampaignStorageRegistrationCard,
} from "@/features/campaigns/components/new-campaign";
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
import {
  AlertCircle as AlertCircleIcon,
  DollarSign,
  PencilIcon,
  PencilLineIcon,
} from "lucide-react";
import { Label } from "@/shared/components/ui/label";

interface UseWalrusDescriptionResult {
  data: string;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

function useWalrusDescription(url: string): UseWalrusDescriptionResult {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["walrus-description", url],
    enabled: Boolean(url),
    queryFn: async () => {
      if (!url) {
        return "";
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch description: ${response.statusText}`);
      }

      return await response.text();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    data: data ?? "",
    isLoading,
    isError,
    error: (error as Error) ?? null,
    refetch,
  };
}

const DEFAULT_FORM_VALUES: EditCampaignFormData = {
  campaignName: "",
  description: "",
  campaignType: "",
  categories: [],
  socials: [],
  campaignDetails: "",
  coverImage: undefined,
  storageEpochs: undefined,
};

const SAVE_STATUS_TIMEOUT = 4000;

type SectionKey =
  | "campaignName"
  | "description"
  | "coverImage"
  | "details"
  | "campaignType"
  | "categories"
  | "socials";

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
  socialWebsite?: string,
  socialDiscord?: string,
  socialTwitter?: string,
): EditCampaignFormData["socials"] {
  const socials: EditCampaignFormData["socials"] = [];

  if (socialWebsite) {
    socials.push({ platform: "website", url: socialWebsite });
  }

  if (socialTwitter) {
    socials.push({ platform: "twitter", url: socialTwitter });
  }

  if (socialDiscord) {
    socials.push({ platform: "discord", url: socialDiscord });
  }

  return socials;
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

export default function EditCampaignPage() {
  const { id: campaignIdParam } = useParams<{ id: string }>();
  const campaignId = campaignIdParam ?? "";
  const account = useCurrentAccount();
  const network = DEFAULT_NETWORK;

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
  const [descriptionInstanceKey, setDescriptionInstanceKey] = useState(0);

  const initialValuesRef = useRef<EditCampaignFormData>(DEFAULT_FORM_VALUES);

  const form = useForm<EditCampaignFormData>({
    resolver: zodResolver(buildEditCampaignSchema()),
    mode: "onChange",
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const {
    campaign,
    isPending: isCampaignLoading,
    error: campaignError,
    refetch: refetchCampaign,
  } = useCampaign(campaignId, network);

  const {
    ownerCapId,
    isLoading: isCapLoading,
    error: capError,
    refetch: refetchCap,
  } = useOwnedCampaignCap(campaignId, network);

  const {
    data: walrusDescription,
    isLoading: isWalrusLoading,
    isError: isWalrusError,
    refetch: refetchWalrus,
  } = useWalrusDescription(campaign?.descriptionUrl || "");

  const {
    data: walrusCoverImageUrl,
    isError: isWalrusImageError,
    refetch: refetchWalrusImage,
  } = useQuery({
    queryKey: ["walrus-cover-image", campaign?.coverImageUrl],
    enabled: Boolean(campaign?.coverImageUrl),
    queryFn: async () => {
      if (!campaign?.coverImageUrl) {
        return "";
      }

      const response = await fetch(campaign.coverImageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    },
  });

  useEffect(() => {
    return () => {
      if (walrusCoverImageUrl) {
        URL.revokeObjectURL(walrusCoverImageUrl);
      }
    };
  }, [walrusCoverImageUrl]);

  const walrus = useWalrusUpload();
  const updateBasics = useUpdateCampaignBasics();
  const updateMetadata = useUpdateCampaignMetadata();
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();

  const hasCampaign = Boolean(campaign);
  const isDeleted = campaign?.isDeleted ?? false;

  useEffect(() => {
    if (!hasCampaign) {
      return;
    }

    if (isWalrusLoading) {
      return;
    }

    const descriptionValue = isWalrusError ? "" : walrusDescription;
    const shouldReset =
      !initialized || (initialDescription === "" && Boolean(descriptionValue));

    if (!shouldReset) {
      return;
    }

    const resetValues: EditCampaignFormData = {
      campaignName: campaign?.name ?? "",
      description: campaign?.shortDescription ?? "",
      campaignType: campaign?.campaignType ?? "",
      categories: parseCategories(campaign?.category),
      socials: buildSocialsFromMetadata(
        campaign?.socialWebsite,
        campaign?.socialDiscord,
        campaign?.socialTwitter,
      ),
      campaignDetails: descriptionValue,
      coverImage: undefined,
      storageEpochs: campaign?.walrusStorageEpochs
        ? Number(campaign.walrusStorageEpochs)
        : undefined,
    };

    form.reset(resetValues);
    initialValuesRef.current = resetValues;
    setInitialDescription(descriptionValue);
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
      if (walrusCoverImageUrl) {
        URL.revokeObjectURL(walrusCoverImageUrl);
      }
      refetchWalrusImage();
    }
    setWalrusErrorAcknowledged(false);
  };

  const showConnectWalletMessage = !account;
  const notAuthorized = Boolean(account) && !ownerCapId && !isCapLoading;

  const loading =
    isCampaignLoading ||
    isCapLoading ||
    (!initialized && isWalrusLoading && !isWalrusError);

  if (!campaignId) {
    return (
      <div className="py-8">
        <div className="container max-w-4xl">
          <Card className="border-red-500">
            <CardContent className="pt-6">
              <p className="text-red-600 font-semibold mb-2">
                Campaign ID missing
              </p>
              <p className="text-sm text-muted-foreground">
                Please navigate to this page with a valid campaign identifier.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
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

  if (campaignError) {
    return (
      <div className="py-8">
        <div className="container max-w-4xl">
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
        <div className="container max-w-4xl">
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
        <div className="container max-w-4xl">
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
        <div className="container max-w-4xl">
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
        <div className="container max-w-4xl">
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
  const formattedFundingGoal = campaignData.fundingGoal ?? "";
  const formattedRecipientAddress = campaignData.recipientAddress ?? "";

  const dirtyFields = form.formState
    .dirtyFields as FieldNamesMarkedBoolean<EditCampaignFormData>;
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

  const watchStorageEpochs = form.watch("storageEpochs");
  const selectedEpochs =
    watchStorageEpochs ??
    (campaignData.walrusStorageEpochs
      ? Number(campaignData.walrusStorageEpochs)
      : undefined);
  const coverImagePreviewUrl =
    walrusCoverImageUrl || campaignData.coverImageUrl || null;

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!ownerCapId) {
      toast.error(
        "Missing campaign owner capability. Connect the correct wallet and try again.",
      );
      return;
    }

    const {
      basicsUpdates,
      metadataPatch,
      shouldUploadWalrus,
      coverImageChanged,
      nextStorageEpochs,
      hasBasicsChanges,
      hasMetadataChanges,
    } = transformEditCampaignFormData({
      values,
      dirtyFields,
      campaign: campaignData,
      initialDescription,
    });

    const metadataUpdates = { ...metadataPatch };

    if (!hasBasicsChanges && !hasMetadataChanges && !shouldUploadWalrus) {
      toast.info("No changes detected.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (shouldUploadWalrus) {
        const epochsToUse = nextStorageEpochs ?? selectedEpochs ?? 0;
        if (!epochsToUse) {
          throw new Error(
            "Storage epochs must be greater than zero for Walrus uploads.",
          );
        }

        const coverImageFile =
          coverImageChanged && values.coverImage
            ? values.coverImage
            : await fetchCoverImageFile(campaignData.coverImageUrl);

        const walrusFormData = {
          name: campaignData.name,
          short_description: values.description,
          subdomain_name: campaignData.subdomainName,
          category: metadataUpdates.category ?? campaignData.category ?? "",
          funding_goal: campaignData.fundingGoal ?? "0",
          start_date: new Date(campaignData.startDateMs),
          end_date: new Date(campaignData.endDateMs),
          recipient_address: campaignData.recipientAddress,
          full_description: values.campaignDetails ?? "",
          cover_image: coverImageFile,
          social_twitter:
            metadataUpdates.social_twitter ??
            campaignData.socialTwitter ??
            undefined,
          social_discord:
            metadataUpdates.social_discord ??
            campaignData.socialDiscord ??
            undefined,
          social_website:
            metadataUpdates.social_website ??
            campaignData.socialWebsite ??
            undefined,
        };

        const flowState = await walrus.prepare.mutateAsync({
          formData: walrusFormData,
          storageEpochs: epochsToUse,
          network,
        });

        const registerResult = await walrus.register.mutateAsync(flowState);
        await walrus.upload.mutateAsync({
          flowState,
          registerDigest: registerResult.transactionDigest,
        });
        const certifyResult = await walrus.certify.mutateAsync(flowState);

        metadataUpdates.walrus_quilt_id = certifyResult.blobId;
        metadataUpdates.walrus_storage_epochs =
          certifyResult.storageEpochs.toString();
        metadataUpdates.cover_image_id = "cover.jpg";
        setInitialDescription(values.campaignDetails ?? "");
        setDescriptionInstanceKey((prev) => prev + 1);
      }

      const metadataKeys = Object.keys(metadataUpdates).filter(
        (key) =>
          metadataUpdates[key as keyof typeof metadataUpdates] !== undefined,
      );

      const hasMetadataPayload = metadataKeys.length > 0;

      const config = getContractConfig(network);

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
      if (coverImageDirty || shouldUploadWalrus) {
        markSectionSaved("coverImage");
      }
      if (detailsDirty || storageEpochsDirty || shouldUploadWalrus) {
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
  });

  const disableSubmit =
    isSubmitting ||
    !(
      campaignNameDirty ||
      descriptionDirty ||
      coverImageDirty ||
      detailsDirty ||
      storageEpochsDirty ||
      campaignTypeDirty ||
      categoriesDirty ||
      socialsDirty
    );

  const sectionStatuses: Record<SectionKey, string | null> = {
    campaignName: getSectionStatus("campaignName", campaignNameDirty),
    description: getSectionStatus("description", descriptionDirty),
    coverImage: getSectionStatus("coverImage", coverImageDirty),
    details: getSectionStatus("details", detailsDirty || storageEpochsDirty),
    campaignType: getSectionStatus("campaignType", campaignTypeDirty),
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

  return (
    <div className="py-8">
      <div className="container">
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
                <Link to={ROUTES.CAMPAIGNS_DETAIL.replace(":id", campaignId)}>
                  Campaign
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit campaign</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="container flex justify-center">
        <div className="w-full max-w-3xl px-4">
          <Form {...form}>
            <form className="flex flex-col gap-16" onSubmit={handleSubmit}>
              <div className="flex flex-col items-center text-center gap-4">
                <h1 className="text-5xl font-bold">
                  Edit <span className="text-primary">{campaignData.name}</span>{" "}
                  Campaign
                </h1>
                <p>
                  Any updates to campaign details may incur extra storage fees.
                  Please review the fields and update them as needed.
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
                    <FormItem className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <FormLabel className="font-medium text-base">
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
                    <FormItem className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <FormLabel className="font-medium text-base">
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

              <CampaignTypeSelector
                disabled={!editingSections.campaignType}
                headerStatus={
                  <FieldStatusBadge status={sectionStatuses.campaignType} />
                }
                headerAction={renderEditButton("campaignType")}
              />

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
                  <h2 className="text-2xl font-semibold">Campaign Timeline</h2>
                  <FieldStatusBadge status="Can't Edit" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Timeline cannot be edited after launch. These dates were set
                  when the campaign was created.
                </p>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label className="font-medium text-base">Start date</Label>
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
                      Add a max funding amount for your campaign
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
                    <p className="font-normal text-xs text-[#8f9197]">
                      This is the wallet that will receive all donation funds
                    </p>
                  </div>
                </div>
              </section>

              <Separator />

              <section className="flex flex-col gap-8 mb-12">
                <h2 className="text-2xl font-semibold">Additional Details</h2>

                <CampaignSocialsSection
                  disabled={!editingSections.socials}
                  labelStatus={
                    <FieldStatusBadge status={sectionStatuses.socials} />
                  }
                  labelAction={renderEditButton("socials")}
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
                    costs={[]}
                    totalCost="—"
                    hideRegisterButton={!editingSections.details}
                    isLocked={!editingSections.details}
                    disabled={!editingSections.details}
                    storageRegistered={false}
                    selectedEpochs={selectedEpochs}
                    onEpochsChange={(value) =>
                      form.setValue("storageEpochs", value, {
                        shouldDirty: true,
                      })
                    }
                    estimatedCost={null}
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
  );
}
