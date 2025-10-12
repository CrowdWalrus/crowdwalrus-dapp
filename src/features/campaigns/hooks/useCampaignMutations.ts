import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";

import {
  buildToggleActiveTransaction,
  buildUpdateCampaignBasicsTransaction,
  buildUpdateCampaignMetadataTransaction,
} from "@/services/campaign-transaction";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { MetadataPatch } from "../types/campaign";

export function useUpdateCampaignBasics() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  return async (
    campaignId: string,
    ownerCapId: string,
    updates: { name?: string; short_description?: string },
  ) => {
    const tx = buildUpdateCampaignBasicsTransaction(
      campaignId,
      ownerCapId,
      updates,
      DEFAULT_NETWORK,
    );

    return await signAndExecute({
      transaction: tx,
    });
  };
}

export function useUpdateCampaignMetadata() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  return async (
    campaignId: string,
    ownerCapId: string,
    patch: MetadataPatch,
  ) => {
    const tx = buildUpdateCampaignMetadataTransaction(
      campaignId,
      ownerCapId,
      patch,
      DEFAULT_NETWORK,
    );

    return await signAndExecute({
      transaction: tx,
    });
  };
}

export function useToggleCampaignStatus() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  return async (
    campaignId: string,
    ownerCapId: string,
    newStatus: boolean,
  ) => {
    const tx = buildToggleActiveTransaction(
      campaignId,
      ownerCapId,
      newStatus,
      DEFAULT_NETWORK,
    );

    return await signAndExecute({
      transaction: tx,
    });
  };
}
