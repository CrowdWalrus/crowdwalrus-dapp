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
import { CampaignBreadcrumb } from "@/features/campaigns/components/CampaignBreadcrumb";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";

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

type SectionKey = "basics" | "media" | "metadata";

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
    basics: false,
    media: false,
    metadata: false,
  });
  const [savedSections, setSavedSections] = useState<Record<SectionKey, number>>({
    basics: 0,
    media: 0,
    metadata: 0,
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
  const basicsDirty =
    isEditFieldDirty(dirtyFields, "campaignName") ||
    isEditFieldDirty(dirtyFields, "description");
  const mediaDirty =
    Boolean(dirtyFields.coverImage) ||
    isEditFieldDirty(dirtyFields, "campaignDetails") ||
    isEditFieldDirty(dirtyFields, "storageEpochs");
  const metadataDirty =
    isEditFieldDirty(dirtyFields, "campaignType") ||
    isEditFieldDirty(dirtyFields, "categories") ||
    isEditFieldDirty(dirtyFields, "socials");

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
    if (section === "media" && mediaSectionDisabled) {
      return;
    }
    setEditingSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const cancelSection = (section: SectionKey) => {
    const initialValues = initialValuesRef.current;
    if (section === "basics") {
      form.setValue("campaignName", initialValues.campaignName, { shouldDirty: false });
      form.setValue("description", initialValues.description, { shouldDirty: false });
    }
    if (section === "media") {
      form.setValue("coverImage", undefined, { shouldDirty: false });
      form.setValue("campaignDetails", initialValues.campaignDetails, { shouldDirty: false });
      form.setValue("storageEpochs", initialValues.storageEpochs, { shouldDirty: false });
    }
    if (section === "metadata") {
      form.setValue("campaignType", initialValues.campaignType, { shouldDirty: false });
      form.setValue("categories", initialValues.categories, { shouldDirty: false });
      form.setValue("socials", initialValues.socials, { shouldDirty: false });
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

      if (hasBasicsChanges) {
        markSectionSaved("basics");
      }
      if (shouldUploadWalrus || mediaDirty) {
        markSectionSaved("media");
      }
      if (shouldUploadWalrus || hasMetadataChanges) {
        markSectionSaved("metadata");
      }

      setEditingSections({ basics: false, media: false, metadata: false });

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
    isSubmitting || !(basicsDirty || mediaDirty || metadataDirty);

  return (
    <div className="py-8">
      <div className="container mx-auto max-w-[1120px]">
        <div className="mb-8">
          <CampaignBreadcrumb campaignName={campaignData.name} />
        </div>
        <header className="flex flex-col gap-2 pb-6">
          <h1 className="text-4xl font-bold tracking-tight">
            Edit "{campaignData.name}"
          </h1>
          <p className="text-base text-muted-foreground">
            Update your campaign details, media, and metadata. Immutable fields such as funding goal, recipient address, and timeline remain locked after launch.
          </p>
        </header>

        {walrusWarningVisible && (
          <Card className="border-yellow-500 bg-yellow-50 mb-8">
            <CardContent className="py-4 flex flex-col gap-2">
              <p className="text-yellow-700 font-semibold">
                Unable to load Walrus content
              </p>
              <p className="text-sm text-yellow-800">
                We could not load the campaign media from Walrus. You can still edit basics
                and metadata, but media sections will stay disabled until the content loads.
              </p>
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
            </CardContent>
          </Card>
        )}

        <Form {...form}>
          <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
              <EditableSection
                label="Basics"
                description="Update the campaign title and summary shown across CrowdWalrus."
                isEditing={editingSections.basics}
                onToggleEdit={() => handleToggleSection("basics")}
                status={getSectionStatus("basics", basicsDirty)}
                actions={
                  editingSections.basics ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => cancelSection("basics")}
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
                          disabled={!editingSections.basics}
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
                    <FormItem>
                      <FormLabel>
                        Short description <span className="text-red-300">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of your campaign"
                          rows={4}
                          {...field}
                          disabled={!editingSections.basics}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </EditableSection>

              <EditableSection
                label="Media & story"
                description="Manage your cover image and rich text description stored on Walrus."
                isEditing={editingSections.media}
                onToggleEdit={() => handleToggleSection("media")}
                requiresWalrusWarning
                onWalrusWarningAccepted={() => setEditingSections((prev) => ({ ...prev, media: true }))}
                disabled={mediaSectionDisabled}
                status={getSectionStatus("media", mediaDirty)}
                actions={
                  editingSections.media ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => cancelSection("media")}
                    >
                      Cancel
                    </Button>
                  ) : null
                }
              >
                <CampaignCoverImageUpload
                  disabled={!editingSections.media}
                  initialPreviewUrl={coverImagePreviewUrl}
                />
                <CampaignDetailsEditor
                  disabled={!editingSections.media}
                  instanceKey={descriptionInstanceKey}
                />
                <CampaignStorageRegistrationCard
                  costs={[]}
                  totalCost="—"
                  hideRegisterButton
                  isLocked={!editingSections.media}
                  disabled={!editingSections.media}
                  storageRegistered={false}
                  selectedEpochs={selectedEpochs}
                  onEpochsChange={(value) =>
                    form.setValue("storageEpochs", value, { shouldDirty: true })
                  }
                  estimatedCost={null}
                />
              </EditableSection>

              <EditableSection
                label="Metadata"
                description="Adjust campaign categories and social links."
                isEditing={editingSections.metadata}
                onToggleEdit={() => handleToggleSection("metadata")}
                status={getSectionStatus("metadata", metadataDirty)}
                actions={
                  editingSections.metadata ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => cancelSection("metadata")}
                    >
                      Cancel
                    </Button>
                  ) : null
                }
              >
                <CampaignTypeSelector disabled={!editingSections.metadata} />
                <CampaignCategorySelector disabled={!editingSections.metadata} />
                <CampaignSocialsSection disabled={!editingSections.metadata} />
              </EditableSection>

              <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-semibold mb-4">Immutable settings</h2>
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
              </section>

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

              <div className="flex justify-end">
                <Button type="submit" disabled={disableSubmit}>
                  {isSubmitting ? "Saving..." : "Publish Update"}
                </Button>
              </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
