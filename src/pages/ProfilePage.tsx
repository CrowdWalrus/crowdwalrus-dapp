import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  BanknoteArrowDown,
  FileSpreadsheet,
  HandCoins,
  HandHeart,
  PenLine,
} from "lucide-react";

import {
  ProfileBadgeShowcase,
  ProfileStatsCard,
  ProfileSummaryCard,
  ProfileTabs,
  type ProfileTabConfig,
  type ProfileTabValue,
} from "@/features/profiles/components/profile-page";
import { MyCampaignsSection } from "@/features/profiles/components/my-campaigns";
import { useMyCampaigns } from "@/features/campaigns/hooks/useMyCampaigns";
import { useProfileOwnership } from "@/features/profiles/hooks/useProfileOwnership";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { Button } from "@/shared/components/ui/button";
import { ROUTES } from "@/shared/config/routes";

const DESCRIPTION_EMPTY_STATE =
  "It appears that your profile is currently incomplete. Please take a moment to create your profile and share information about yourself.";

// TODO: Replace placeholder badge assets once on-chain badge metadata lands.
const BADGE_ASSETS = [
  "/assets/images/placeholders/profile-badge-1.png",
  "/assets/images/placeholders/profile-badge-2.png",
  "/assets/images/placeholders/profile-badge-3.png",
  "/assets/images/placeholders/profile-badge-4.png",
];

const DEFAULT_BADGE_ALT = "CrowdWalrus profile badge placeholder";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const myCampaigns = useMyCampaigns();
  const campaignCount = myCampaigns.campaigns.length;

  useDocumentTitle("Profile");

  const addressLabel = formatAddressForDisplay(addressParam);

  // TODO: Replace placeholder conditions once profile data fetching is available.
  const hasProfileData = false;

  const badges = useMemo(
    () =>
      BADGE_ASSETS.map((src, index) => ({
        id: `badge-${index}`,
        src,
        alt: `${DEFAULT_BADGE_ALT} ${index + 1}`,
      })),
    [],
  );

  const placeholderStats = useMemo(() => {
    // TODO: Replace placeholder stats with real profile aggregates.
    return [
      {
        id: "contributions",
        label: "Your Contributions",
        value: "10",
        icon: HandHeart,
      },
      {
        id: "total-contributed",
        label: "Total Amount Contributed",
        value: "$200.40",
        icon: HandCoins,
      },
      {
        id: "campaigns",
        label: "Your Campaigns",
        value: campaignCount.toString(),
        icon: FileSpreadsheet,
      },
      {
        id: "total-raised",
        label: "Total Amount Raised",
        value: "$20,000.00",
        icon: BanknoteArrowDown,
      },
    ];
  }, [campaignCount]);

  const overviewContent = (
    <div className="flex flex-col gap-12">
      <ProfileBadgeShowcase badges={badges} />
      <ProfileStatsCard stats={placeholderStats} />
    </div>
  );

  const campaignsContent = <MyCampaignsSection />;

  const contributionsContent = (
    <div className="rounded-2xl border border-dashed border-black-50 bg-white p-10 text-center">
      <h3 className="text-lg font-semibold text-black-500">My contributions</h3>
      <p className="mt-2 text-sm text-black-400">
        {/* TODO: Populate with contribution history for this profile. */}
        Contribution history will appear here once profile data is connected.
      </p>
    </div>
  );

  const tabs: ProfileTabConfig[] = [
    {
      value: "overview",
      label: "Overview",
      content: overviewContent,
    },
    {
      value: "campaigns",
      label: "My Campaigns",
      badgeCount: campaignCount,
      content: campaignsContent,
    },
    {
      value: "contributions",
      label: "My Contributions",
      // TODO: Wire badge counts to real contribution totals.
      badgeCount: 10,
      content: contributionsContent,
    },
  ];

  const tabParam = searchParams.get("tab");
  const activeTab = PROFILE_TAB_VALUES.includes(
    tabParam as ProfileTabValue,
  )
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

  const createProfileAction =
    isOwner && !hasProfileData ? (
      <Button asChild className="gap-2">
        <Link to={ROUTES.PROFILE_CREATE}>
          <PenLine className="h-4 w-4" />
          Create your profile
        </Link>
      </Button>
    ) : null;

  const summaryDescription = hasProfileData
    ? "Profile details will be displayed here."
    : DESCRIPTION_EMPTY_STATE;

  return (
    <div className="py-10">
      <div className="container px-4 flex justify-center">
        <div className="w-full max-w-4xl flex flex-col gap-10">
          <ProfileSummaryCard
            addressLabel={addressLabel}
            description={summaryDescription}
            action={createProfileAction}
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
