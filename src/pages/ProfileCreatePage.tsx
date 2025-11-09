import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  profileCreateSchema,
  type ProfileCreateFormData,
} from "@/features/profiles/schemas/profileCreateSchema";
import { SubnameField } from "@/features/suins/components/SubnameField";
import {
  CampaignSocialsSection,
  CampaignStorageRegistrationCard,
  type StorageCost,
} from "@/features/campaigns/components/new-campaign";
import {
  DEFAULT_NETWORK,
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

const DEFAULT_VALUES: ProfileCreateFormData = {
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
};

const PROFILE_REFETCH_ATTEMPTS = 4;
const PROFILE_REFETCH_DELAY_MS = 1000;

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

function formatProfileSubdomain(
  value: string,
  campaignDomain: string | null,
) {
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
  values: ProfileCreateFormData,
  currentMetadata: Record<string, string>,
  rawMetadata: Record<string, string>,
  campaignDomain: string | null,
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

  return updates;
}

export default function ProfileCreatePage() {
  useDocumentTitle("Create Profile");

  const form = useForm<ProfileCreateFormData>({
    resolver: zodResolver(profileCreateSchema),
    mode: "onChange",
    defaultValues: DEFAULT_VALUES,
  });

  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const campaignDomain = useNetworkVariable("campaignDomain") ?? null;

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

  const [selectedEpochs, setSelectedEpochs] = useState<number>(
    WALRUS_EPOCH_CONFIG[DEFAULT_NETWORK].defaultEpochs,
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const { formattedBalance, isLoading: isBalanceLoading } = useWalBalance();
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
  const isWalletConnected = Boolean(account?.address);

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
    : profileId
      ? "Save Changes"
      : "Create Profile";

  const isFormReadOnly =
    isSavingProfile || !isWalletConnected || isProfileFetching;
  const isSubmitDisabled = isFormReadOnly;
  const registrationDisabled = !hasProfileImage || isFormReadOnly;

  const storageCosts: StorageCost[] = [];
  const totalCost = hasProfileImage ? "0.00 WAL" : "0.00 WAL";

  const handleEpochsChange = (epochs: number) => {
    const config = WALRUS_EPOCH_CONFIG[DEFAULT_NETWORK];
    const clampedEpochs = Math.min(Math.max(1, epochs), config.maxEpochs);
    setSelectedEpochs(clampedEpochs);
  };

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

    lastInitializedProfileIdRef.current = profileId;
  }, [campaignDomain, form, metadata, profile, profileId]);

  const waitForProfileId = useCallback(async () => {
    for (let attempt = 0; attempt < PROFILE_REFETCH_ATTEMPTS; attempt++) {
      const result = await refetchProfileData();
      const candidate = result.data?.profileId ?? null;
      if (candidate) {
        return candidate;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, PROFILE_REFETCH_DELAY_MS * (attempt + 1)),
      );
    }

    return null;
  }, [refetchProfileData]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!account?.address) {
      toast.error("Connect your wallet to create a profile.");
      return;
    }

    const updates = buildProfileMetadataUpdates(
      values,
      metadata,
      rawMetadata,
      campaignDomain,
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
        targetProfileId = latest.data?.profileId ?? null;
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

      const actionMessage =
        updates.length === 0
          ? "Profile created successfully."
          : existedBeforeSubmit
            ? "Profile updated successfully."
            : "Profile created and updated successfully.";

      toast.success(actionMessage);
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

                    <SubnameField
                      label="Setup your nick name"
                      placeholder="your-name"
                      disabled={isFormReadOnly}
                    />

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
                          <CampaignSocialsSection
                            disabled={isFormReadOnly}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <CampaignStorageRegistrationCard
                  costs={storageCosts}
                  totalCost={totalCost}
                  walBalance={
                    isBalanceLoading ? "Loading..." : formattedBalance
                  }
                  selectedEpochs={selectedEpochs}
                  onEpochsChange={handleEpochsChange}
                  disabled={registrationDisabled}
                  hideRegisterButton={!hasProfileImage}
                  onRegister={() =>
                    toast.info("Walrus storage registration coming soon.")
                  }
                  registrationPeriodSummary="Profile images follow the default storage duration."
                  registrationPeriodHint="Adjustable once profile storage is implemented."
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
