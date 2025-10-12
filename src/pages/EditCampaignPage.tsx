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
import { EditableSection } from "@/features/campaigns/components/EditableSection";
import {
  CampaignCoverImageUpload,
  CampaignDetailsEditor,
  CampaignTypeSelector,
  CampaignCategorySelector,
  CampaignSocialsSection,
  CampaignStorageRegistrationCard,
  CampaignTimeline,
  CampaignFundingTargetSection,
} from "@/features/campaigns/components/new-campaign";
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
import { AlertCircle as AlertCircleIcon } from "lucide-react";

interface UseWalrusDescriptionResult {
  data: string;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

function useWalrusDescription(url: string): UseWalrusDescriptionResult {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
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
  return new File([blob], `cover.${extension}`, { type: blob.type || "image/jpeg" });
}

export default function EditCampaignPage() {
  const { id: campaignIdParam } = useParams<{ id: string }>();
  const campaignId = campaignIdParam ?? "";
  const account = useCurrentAccount();
  const network = DEFAULT_NETWORK;

  const [initialized, setInitialized] = useState(false);
  const [initialDescription, setInitialDescription] = useState("");
  const [walrusErrorAcknowledged, setWalrusErrorAcknowledged] = useState(false);
  const [editingSections, setEditingSections] = useState<Record<SectionKey, boolean>>({
    campaignName: false,
    description: false,
    coverImage: false,
    details: false,
    campaignType: false,
    categories: false,
    socials: false,
  });
  const [savedSections, setSavedSections] = useState<Record<SectionKey, number>>({
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
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

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
      !initialized ||
      (initialDescription === "" && Boolean(descriptionValue));

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
              <p className="text-red-600 font-semibold mb-2">Campaign ID missing</p>
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
              <p className="text-yellow-600 font-semibold">Campaign not found</p>
              <p className="text-sm text-muted-foreground">Campaign ID: {campaignId}</p>
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
              <p className="text-yellow-600 font-semibold">Connect your wallet</p>
              <p className="text-sm text-muted-foreground">
                Please connect the wallet that owns this campaign to continue with edits.
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
                <p className="text-sm text-muted-foreground">{capError.message}</p>
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
                The connected wallet does not have permission to edit this campaign.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const campaignData = campaign!;

  const dirtyFields = form.formState.dirtyFields as FieldNamesMarkedBoolean<EditCampaignFormData>;
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

  const handleToggleSection = (section: SectionKey) => {
    if (
      mediaSectionDisabled &&
      (section === "coverImage" || section === "details")
    ) {
      return;
    }
    setEditingSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const cancelSection = (section: SectionKey) => {
    const initialValues = initialValuesRef.current;
    switch (section) {
      case "campaignName":
        form.setValue("campaignName", initialValues.campaignName, {
          shouldDirty: false,
        });
        break;
      case "description":
        form.setValue("description", initialValues.description, {
          shouldDirty: false,
        });
        break;
      case "coverImage":
        form.setValue("coverImage", undefined, { shouldDirty: false });
        break;
      case "details":
        form.setValue("campaignDetails", initialValues.campaignDetails, {
          shouldDirty: false,
        });
        form.setValue("storageEpochs", initialValues.storageEpochs, {
          shouldDirty: false,
        });
        break;
      case "campaignType":
        form.setValue("campaignType", initialValues.campaignType, {
          shouldDirty: false,
        });
        break;
      case "categories":
        form.setValue("categories", initialValues.categories, {
          shouldDirty: false,
        });
        break;
      case "socials":
        form.setValue("socials", initialValues.socials, {
          shouldDirty: false,
        });
        break;
    }
    setEditingSections((prev) => ({ ...prev, [section]: false }));
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
      toast.error("Missing campaign owner capability. Connect the correct wallet and try again.");
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
          throw new Error("Storage epochs must be greater than zero for Walrus uploads.");
        }

        const coverImageFile = coverImageChanged && values.coverImage
          ? values.coverImage
          : await fetchCoverImageFile(campaignData.coverImageUrl);

        const walrusFormData = {
          name: campaignData.name,
          short_description: values.description,
          subdomain_name: campaignData.subdomainName,
          category:
            metadataUpdates.category ?? campaignData.category ?? "",
          funding_goal: campaignData.fundingGoal ?? "0",
          start_date: new Date(campaignData.startDateMs),
          end_date: new Date(campaignData.endDateMs),
          recipient_address: campaignData.recipientAddress,
          full_description: values.campaignDetails ?? "",
          cover_image: coverImageFile,
          social_twitter:
            metadataUpdates.social_twitter ?? campaignData.socialTwitter ?? undefined,
          social_discord:
            metadataUpdates.social_discord ?? campaignData.socialDiscord ?? undefined,
          social_website:
            metadataUpdates.social_website ?? campaignData.socialWebsite ?? undefined,
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
        metadataUpdates.walrus_storage_epochs = certifyResult.storageEpochs.toString();
        metadataUpdates.cover_image_id = "cover.jpg";
        setInitialDescription(values.campaignDetails ?? "");
        setDescriptionInstanceKey((prev) => prev + 1);
      }

      const metadataKeys = Object.keys(metadataUpdates).filter(
        (key) => metadataUpdates[key as keyof typeof metadataUpdates] !== undefined,
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
          (key) => metadataUpdates[key as keyof typeof metadataUpdates] as string,
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
                <h1 className="text-4xl font-bold">Edit Campaign</h1>
                <p className="text-muted-foreground text-base">
                  Keep your campaign details up to date. Timeline, funding goal, and donation
                  address stay read-only after launch.
                </p>
              </div>

              {walrusWarningVisible ? (
                <Alert className="border-yellow-500 bg-yellow-50">
                  <AlertDescription className="flex flex-col gap-3 text-yellow-800">
                    <span className="font-semibold">Unable to load Walrus content</span>
                    <span className="text-sm">
                      We couldn’t load the campaign media from Walrus. You can still edit basics
                      and metadata, but media sections stay disabled until the content loads.
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleRetryWalrus}>
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

              <section className="flex flex-col gap-8">
                <h2 className="text-2xl font-semibold">Campaign Details</h2>

                <EditableSection
                  label="Title"
                  isEditing={editingSections.campaignName}
                  onToggleEdit={() => handleToggleSection("campaignName")}
                  status={getSectionStatus("campaignName", campaignNameDirty)}
                  actions={
                    editingSections.campaignName ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => cancelSection("campaignName")}
                      >
                        Cancel
                      </Button>
                    ) : null
                  }
                >
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
                            disabled={!editingSections.campaignName}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </EditableSection>

                <EditableSection
                  label="Short description"
                  isEditing={editingSections.description}
                  onToggleEdit={() => handleToggleSection("description")}
                  status={getSectionStatus("description", descriptionDirty)}
                  actions={
                    editingSections.description ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => cancelSection("description")}
                      >
                        Cancel
                      </Button>
                    ) : null
                  }
                >
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Short description <span className="text-red-300">*</span>
                        </FormLabel>
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
                </EditableSection>

                <EditableSection
                  label="Cover image"
                  isEditing={editingSections.coverImage}
                  onToggleEdit={() => handleToggleSection("coverImage")}
                  requiresWalrusWarning
                  onWalrusWarningAccepted={() =>
                    setEditingSections((prev) => ({ ...prev, coverImage: true }))
                  }
                  disabled={mediaSectionDisabled}
                  status={getSectionStatus("coverImage", coverImageDirty)}
                  actions={
                    editingSections.coverImage ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => cancelSection("coverImage")}
                      >
                        Cancel
                      </Button>
                    ) : null
                  }
                >
                  <CampaignCoverImageUpload
                    disabled={!editingSections.coverImage}
                    initialPreviewUrl={coverImagePreviewUrl}
                  />
                </EditableSection>
              </section>

              <Separator />

              <section className="flex flex-col gap-8">
                <h2 className="text-2xl font-semibold">Campaign Configuration</h2>

                <EditableSection
                  label="Campaign type"
                  isEditing={editingSections.campaignType}
                  onToggleEdit={() => handleToggleSection("campaignType")}
                  status={getSectionStatus("campaignType", campaignTypeDirty)}
                  actions={
                    editingSections.campaignType ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => cancelSection("campaignType")}
                      >
                        Cancel
                      </Button>
                    ) : null
                  }
                >
                  <CampaignTypeSelector disabled={!editingSections.campaignType} />
                </EditableSection>

                <EditableSection
                  label="Categories"
                  isEditing={editingSections.categories}
                  onToggleEdit={() => handleToggleSection("categories")}
                  status={getSectionStatus("categories", categoriesDirty)}
                  actions={
                    editingSections.categories ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => cancelSection("categories")}
                      >
                        Cancel
                      </Button>
                    ) : null
                  }
                >
                  <CampaignCategorySelector disabled={!editingSections.categories} />
                </EditableSection>
              </section>

              <Separator />

              <section className="flex flex-col gap-8">
                <h2 className="text-2xl font-semibold">Additional Details</h2>

                <EditableSection
                  label="Social links"
                  isEditing={editingSections.socials}
                  onToggleEdit={() => handleToggleSection("socials")}
                  status={getSectionStatus("socials", socialsDirty)}
                  actions={
                    editingSections.socials ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => cancelSection("socials")}
                      >
                        Cancel
                      </Button>
                    ) : null
                  }
                >
                  <CampaignSocialsSection disabled={!editingSections.socials} />
                </EditableSection>

                <EditableSection
                  label="Campaign story"
                  description="Update the rich text description stored on Walrus."
                  isEditing={editingSections.details}
                  onToggleEdit={() => handleToggleSection("details")}
                  requiresWalrusWarning
                  onWalrusWarningAccepted={() =>
                    setEditingSections((prev) => ({ ...prev, details: true }))
                  }
                  disabled={mediaSectionDisabled}
                  status={getSectionStatus("details", detailsDirty || storageEpochsDirty)}
                  actions={
                    editingSections.details ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => cancelSection("details")}
                      >
                        Cancel
                      </Button>
                    ) : null
                  }
                >
                  <CampaignDetailsEditor
                    disabled={!editingSections.details}
                    instanceKey={descriptionInstanceKey}
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
                      form.setValue("storageEpochs", value, { shouldDirty: true })
                    }
                    estimatedCost={null}
                  />
                </EditableSection>
              </section>

              <Separator />

              <section className="flex flex-col gap-8">
                <h2 className="text-2xl font-semibold">Immutable settings</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Subdomain
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {campaignData.subdomainName}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Status
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {campaignData.isActive ? "Active" : "Paused"}
                    </p>
                  </div>
                </div>

                <CampaignTimeline
                  readOnly
                  startDateMs={campaignData.startDateMs}
                  endDateMs={campaignData.endDateMs}
                />

                <CampaignFundingTargetSection
                  readOnly
                  fundingGoal={campaignData.fundingGoal}
                  recipientAddress={campaignData.recipientAddress}
                />
              </section>

              <Separator />

              <section className="flex flex-col gap-6">
                <Alert>
                  <AlertDescription className="flex items-center gap-2">
                    <AlertCircleIcon className="size-4" />
                    Publishing updates requires a Sui transaction. Review your edits before
                    proceeding.
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
            </form>
          </Form>
        </div>
      </div>
    </div>
  );

}
