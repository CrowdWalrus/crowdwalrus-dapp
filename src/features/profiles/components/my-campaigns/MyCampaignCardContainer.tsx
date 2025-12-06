import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CircleCheck,
  ExternalLink,
  OctagonMinus,
  Pencil,
  SendHorizontal,
} from "lucide-react";

import type { CampaignData } from "@/features/campaigns/hooks/useAllCampaigns";
import { useCampaignStats } from "@/features/campaigns/hooks/useCampaignStats";
import { useCampaignOwnership } from "@/features/campaigns/hooks/useCampaignOwnership";
import { useActivateCampaign } from "@/features/campaigns/hooks/useActivateCampaign";
import { useDeactivateCampaign } from "@/features/campaigns/hooks/useDeactivateCampaign";
import { DeactivateCampaignModal } from "@/features/campaigns/components/modals/DeactivateCampaignModal";
import { ActivateCampaignModal } from "@/features/campaigns/components/modals/ActivateCampaignModal";
import {
  DEFAULT_NETWORK,
  useNetworkVariable,
} from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";
import {
  buildCampaignAddUpdatePath,
  buildCampaignDetailPath,
  buildCampaignEditPath,
} from "@/shared/utils/routes";
import { MyCampaignCard } from "./MyCampaignCard";

interface MyCampaignCardContainerProps {
  campaign: CampaignData;
  network?: SupportedNetwork;
  onMutation?: () => void | Promise<void>;
  className?: string;
}

export function MyCampaignCardContainer({
  campaign,
  network = DEFAULT_NETWORK,
  onMutation,
  className,
}: MyCampaignCardContainerProps) {
  const campaignDomain = useNetworkVariable("campaignDomain") as
    | string
    | undefined;

  const {
    isOwner,
    ownerCapId,
    accountAddress,
    refetchOwnership,
    isOwnershipLoading,
  } = useCampaignOwnership({
    campaignId: campaign.id,
    network,
  });

  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const {
    totalUsdMicro,
    uniqueDonorsCount,
    isPending: isStatsPending,
    error: statsError,
  } = useCampaignStats({
    campaignId: campaign.id,
    enabled: Boolean(campaign.id),
  });

  useEffect(() => {
    if (statsError) {
      console.warn(
        `[MyCampaignCardContainer] Failed to load stats for ${campaign.id}:`,
        statsError,
      );
    }
  }, [campaign.id, statsError]);

  const handleMutation = useCallback(async () => {
    await refetchOwnership();
    await onMutation?.();
  }, [onMutation, refetchOwnership]);

  const {
    deactivateCampaign,
    isProcessing: isDeactivationProcessing,
  } = useDeactivateCampaign({
    campaignId: campaign.id,
    ownerCapId,
    isActive: campaign.isActive,
    accountAddress,
    network,
    onSuccess: handleMutation,
  });

  const {
    activateCampaign,
    isProcessing: isActivationProcessing,
  } = useActivateCampaign({
    campaignId: campaign.id,
    ownerCapId,
    isActive: campaign.isActive,
    accountAddress,
    network,
    onSuccess: handleMutation,
  });

  const detailPath = useMemo(
    () =>
      buildCampaignDetailPath(campaign.id, {
        subdomainName: campaign.subdomainName,
        campaignDomain,
      }),
    [campaign.id, campaign.subdomainName, campaignDomain],
  );

  const editPath = useMemo(
    () =>
      buildCampaignEditPath(campaign.id, {
        subdomainName: campaign.subdomainName,
        campaignDomain,
      }),
    [campaign.id, campaign.subdomainName, campaignDomain],
  );

  const updatePath = useMemo(
    () =>
      buildCampaignAddUpdatePath(campaign.id, {
        subdomainName: campaign.subdomainName,
        campaignDomain,
      }),
    [campaign.id, campaign.subdomainName, campaignDomain],
  );

  const isCampaignArchived = campaign.isDeleted;
  const anyProcessing = isDeactivationProcessing || isActivationProcessing;
  const actionDisabled =
    !isOwner || isCampaignArchived || isOwnershipLoading || anyProcessing;

  const quickActions = useMemo(() => {
    const baseDisable =
      !isOwner || isCampaignArchived || isOwnershipLoading || anyProcessing;

    return [
      {
        id: "post-update",
        label: "Post an Update",
        icon: SendHorizontal,
        variant: "primary" as const,
        href: updatePath,
        disabled: baseDisable,
      },
      {
        id: "view-campaign",
        label: "View Campaign",
        icon: ExternalLink,
        variant: "secondary" as const,
        href: detailPath,
      },
      {
        id: "edit-campaign",
        label: "Edit Campaign",
        icon: Pencil,
        variant: "secondary" as const,
        href: editPath,
        disabled: baseDisable,
      },
      campaign.isActive
        ? {
            id: "deactivate-campaign",
            label: "Deactivate",
            icon: OctagonMinus,
            variant: "warning" as const,
            onClick: () => setIsDeactivateModalOpen(true),
            disabled: actionDisabled,
            loading: isDeactivationProcessing,
          }
        : {
            id: "activate-campaign",
            label: "Activate",
            icon: CircleCheck,
            variant: "success" as const,
            onClick: () => setIsActivateModalOpen(true),
            disabled: actionDisabled,
            loading: isActivationProcessing,
          },
    ];
  }, [
    actionDisabled,
    anyProcessing,
    campaign.isActive,
    detailPath,
    editPath,
    isActivationProcessing,
    isCampaignArchived,
    isDeactivationProcessing,
    isOwner,
    isOwnershipLoading,
    updatePath,
  ]);

  return (
    <>
      <MyCampaignCard
        campaign={campaign}
        actions={quickActions}
        raisedAmountUsdMicro={
          statsError || isStatsPending ? 0n : totalUsdMicro
        }
        supportersCount={
          statsError || isStatsPending ? undefined : uniqueDonorsCount
        }
        className={className}
      />

      {campaign.isActive && (
        <DeactivateCampaignModal
          open={isDeactivateModalOpen}
          onClose={() => setIsDeactivateModalOpen(false)}
          onConfirm={async () => {
            setIsDeactivateModalOpen(false);
            const result = await deactivateCampaign();
            if (
              result === "missing_campaign" ||
              result === "missing_wallet" ||
              result === "missing_owner_cap" ||
              result === "user_rejected" ||
              result === "error"
            ) {
              setIsDeactivateModalOpen(true);
            }
          }}
        />
      )}

      {!campaign.isActive && !campaign.isDeleted && (
        <ActivateCampaignModal
          open={isActivateModalOpen}
          onClose={() => setIsActivateModalOpen(false)}
          onConfirm={async () => {
            setIsActivateModalOpen(false);
            const result = await activateCampaign();
            if (
              result === "missing_campaign" ||
              result === "missing_wallet" ||
              result === "missing_owner_cap" ||
              result === "user_rejected" ||
              result === "error"
            ) {
              setIsActivateModalOpen(true);
            }
          }}
        />
      )}
    </>
  );
}
