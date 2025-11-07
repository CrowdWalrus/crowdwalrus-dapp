export interface ProfileOwnershipParams {
  currentAccountAddress: string | null;
  profileAddress: string | null | undefined;
}

/**
 * Determine whether the connected account owns the profile.
 * TODO: Replace simple address comparison with on-chain ownership check
 *       when the profile Sui objects are integrated.
 */
export function deriveIsProfileOwner({
  currentAccountAddress,
  profileAddress,
}: ProfileOwnershipParams): boolean {
  if (!currentAccountAddress || !profileAddress) {
    return false;
  }

  const normalizedCurrent = currentAccountAddress.trim().toLowerCase();
  const normalizedProfile = profileAddress.trim().toLowerCase();

  return normalizedCurrent === normalizedProfile;
}
