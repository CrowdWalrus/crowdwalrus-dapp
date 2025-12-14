import { useMemo } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  BanknoteArrowDown,
  FileSpreadsheet,
  HandCoins,
  HandHeart,
  PenLine,
} from "lucide-react";

import {
  ProfileBadgeShowcase,
  ProfilePageSkeleton,
  ProfileStatsCard,
  ProfileSummaryCard,
  ProfileTabs,
  type ProfileTabConfig,
  type ProfileTabValue,
} from "@/features/profiles/components/profile-page";
import { MyCampaignsSection } from "@/features/profiles/components/my-campaigns";
import { useMyCampaigns } from "@/features/campaigns/hooks/useMyCampaigns";
import { useOwnerCampaigns } from "@/features/campaigns/hooks/useOwnerCampaigns";
import { parseSocialLinksFromMetadata } from "@/features/campaigns/utils/socials";
import { useDonorBadges } from "@/features/badges/hooks/useDonorBadges";
import { useProfile } from "@/features/profiles/hooks/useProfile";
import { useProfileOwnership } from "@/features/profiles/hooks/useProfileOwnership";
import { ProfileDonationsTable } from "@/features/profiles/components/ProfileDonationsTable";
import { PROFILE_METADATA_KEYS } from "@/features/profiles/constants/metadata";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { ROUTES } from "@/shared/config/routes";
import { useNetworkVariable } from "@/shared/config/networkConfig";
import { formatUsdLocaleFromMicros } from "@/shared/utils/currency";

const DESCRIPTION_EMPTY_STATE =
  "It appears that your profile is currently incomplete. Please take a moment to create your profile and share information about yourself.";

const DESCRIPTION_EMPTY_STATE_PUBLIC =
  "This supporter hasn't shared their profile details yet.";

const PROFILE_TAB_VALUES: ProfileTabValue[] = [
  "overview",
  "campaigns",
  "contributions",
];

const formatAddressForDisplay = (address?: string | null) => {
  if (!address || address.length < 10) {
    return address ?? "Profile";
  }
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

export function ProfilePage() {
  const { address: addressParam } = useParams<{ address: string }>();
  const { isOwner } = useProfileOwnership({ profileAddress: addressParam });
  const {
    metadata: metadataMap,
    profile,
    hasProfile,
    isPending: isProfilePending,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile,
  } = useProfile({
    ownerAddress: addressParam,
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const myCampaigns = useMyCampaigns();
  const ownerCampaigns = useOwnerCampaigns({
    ownerAddress: addressParam,
    enabled: !isOwner,
  });
  const activeCampaignData = isOwner
    ? myCampaigns
    : { ...ownerCampaigns, isConnected: true };
  const campaignCount = activeCampaignData.campaigns.length;

  useDocumentTitle("Profile");
  const campaignDomain = useNetworkVariable("campaignDomain");

  const addressLabel = formatAddressForDisplay(addressParam);

  const socialLinks = useMemo(
    () => parseSocialLinksFromMetadata(metadataMap),
    [metadataMap],
  );

  const { badges: donorBadges } = useDonorBadges({
    ownerAddress: addressParam,
    enabled: Boolean(addressParam),
  });

  const fullName = (metadataMap[PROFILE_METADATA_KEYS.FULL_NAME] ?? "").trim();
  const email = (metadataMap[PROFILE_METADATA_KEYS.EMAIL] ?? "").trim();
  const bio = (metadataMap[PROFILE_METADATA_KEYS.BIO] ?? "").trim();
  const subdomain = (
    profile?.subdomainName ?? metadataMap[PROFILE_METADATA_KEYS.SUBDOMAIN] ?? ""
  ).trim();
  const avatarWalrusUrl = (
    metadataMap[PROFILE_METADATA_KEYS.AVATAR_WALRUS_ID] ?? ""
  ).trim();
  const profileDisplayName = fullName || addressLabel;

  const hasDisplayableMetadata = Boolean(
    fullName ||
      email ||
      bio ||
      subdomain ||
      avatarWalrusUrl ||
      socialLinks.length > 0,
  );
  const shouldShowProfileDetails = hasProfile && hasDisplayableMetadata;
  const summaryMetadata = shouldShowProfileDetails
    ? {
        fullName,
        subdomain,
        email,
        bio,
        socialLinks,
        avatarWalrusUrl,
      }
    : null;

  const badges = useMemo(
    () =>
      donorBadges.map((badge) => ({
        id: badge.objectId,
        src: badge.imageUrl,
        alt: `CrowdWalrus donor badge level ${badge.level}`,
      })),
    [donorBadges],
  );

  const placeholderStats = useMemo(() => {
    const contributions = profile?.totalDonationsCount ?? 0;
    const totalContributedMicros = profile?.totalUsdMicro ?? BigInt(0);
    const totalRaisedNetMicros =
      profile?.fundraisingTotals.recipientTotalUsdMicro ?? BigInt(0);

    return [
      {
        id: "contributions",
        label: "Contributions",
        value: contributions.toString(),
        icon: HandHeart,
      },
      {
        id: "total-contributed",
        label: "Total Amount Contributed",
        value: `$${formatUsdLocaleFromMicros(totalContributedMicros)}`,
        icon: HandCoins,
      },
      {
        id: "campaigns",
        label: "Campaigns",
        value: campaignCount.toString(),
        icon: FileSpreadsheet,
      },
      {
        id: "total-raised",
        label: "Total Amount Raised",
        value: `$${formatUsdLocaleFromMicros(totalRaisedNetMicros)}`,
        icon: BanknoteArrowDown,
      },
    ];
  }, [
    campaignCount,
    profile?.fundraisingTotals.recipientTotalUsdMicro,
    profile?.totalDonationsCount,
    profile?.totalUsdMicro,
  ]);

  if (!addressParam) {
    return <Navigate to={ROUTES.NOT_FOUND} replace />;
  }

  if (isProfilePending) {
    return <ProfilePageSkeleton />;
  }

  if (isProfileError) {
    const message =
      profileError?.message ?? "Unable to load this profile. Please try again.";
    return (
      <div className="py-10">
        <div className="container px-4 flex justify-center">
          <Card className="w-full max-w-2xl border border-red-200 bg-red-50">
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-white text-red-500">
                <AlertCircle className="size-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-red-600">
                  Unable to load profile
                </h3>
                <p className="text-sm text-red-500">{message}</p>
              </div>
              <Button variant="outline" onClick={() => void refetchProfile()}>
                Try again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const overviewContent = (
    <div className="flex flex-col gap-12">
      <ProfileBadgeShowcase badges={badges} />
      <ProfileStatsCard stats={placeholderStats} />
    </div>
  );

  const campaignsContent = (
    <MyCampaignsSection
      data={activeCampaignData}
      isOwnerView={isOwner}
      profileDisplayName={profileDisplayName}
    />
  );

  const campaignsTabLabel = isOwner ? "My Campaigns" : "Campaigns";
  const contributionsTabLabel = isOwner ? "My Contributions" : "Contributions";
  const contributionsCount = profile?.totalDonationsCount ?? 0;

  const contributionsContent = (
    <ProfileDonationsTable
      ownerAddress={addressParam}
      campaignDomain={campaignDomain}
      title={contributionsTabLabel}
    />
  );

  const tabs: ProfileTabConfig[] = [
    {
      value: "overview",
      label: "Overview",
      content: overviewContent,
    },
    {
      value: "campaigns",
      label: campaignsTabLabel,
      badgeCount: campaignCount,
      content: campaignsContent,
    },
    {
      value: "contributions",
      label: contributionsTabLabel,
      badgeCount: contributionsCount,
      content: contributionsContent,
    },
  ];

  const tabParam = searchParams.get("tab");
  const activeTab = PROFILE_TAB_VALUES.includes(tabParam as ProfileTabValue)
    ? (tabParam as ProfileTabValue)
    : "overview";

  const handleTabChange = (nextValue: ProfileTabValue) => {
    const params = new URLSearchParams(searchParams);
    if (nextValue === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", nextValue);
    }
    setSearchParams(params, { replace: true });
  };

  const profileAction = isOwner ? (
    <Button asChild className="gap-2">
      <Link to={ROUTES.PROFILE_CREATE}>
        <PenLine className="h-4 w-4" />
        {shouldShowProfileDetails ? "Edit profile" : "Create your profile"}
      </Link>
    </Button>
  ) : null;

  const summaryDescription = shouldShowProfileDetails
    ? ""
    : isOwner
      ? DESCRIPTION_EMPTY_STATE
      : DESCRIPTION_EMPTY_STATE_PUBLIC;

  if (!isProfilePending && !isProfileError && !hasProfile && !isOwner) {
    return <Navigate to={ROUTES.NOT_FOUND} replace />;
  }

  return (
    <div className="py-10">
      <div className="container px-4 flex justify-center">
        <div className="w-full max-w-4xl flex flex-col gap-10">
          <ProfileSummaryCard
            addressLabel={addressLabel}
            description={summaryDescription}
            action={profileAction}
            metadata={summaryMetadata}
          />

          <ProfileTabs
            tabs={tabs}
            value={activeTab}
            onValueChange={handleTabChange}
          />
        </div>
      </div>
    </div>
  );
}
