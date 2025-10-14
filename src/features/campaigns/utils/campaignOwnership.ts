export interface CampaignOwnershipParams {
  currentAccountAddress: string | null;
  campaignId: string | null | undefined;
  ownerCapId: string | null;
}

/**
 * Determine whether the connected account owns the campaign.
 * Ownership is proven when the account holds the CampaignOwnerCap
 * associated with the campaign identifier.
 */
export function deriveIsCampaignOwner({
  currentAccountAddress,
  campaignId,
  ownerCapId,
}: CampaignOwnershipParams): boolean {
  if (!currentAccountAddress) {
    return false;
  }

  if (!campaignId) {
    return false;
  }

  return Boolean(ownerCapId);
}

