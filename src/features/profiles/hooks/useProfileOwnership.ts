import { useMemo } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";

import { deriveIsProfileOwner } from "@/features/profiles/utils/profileOwnership";

interface UseProfileOwnershipOptions {
  profileAddress?: string | null;
}

interface UseProfileOwnershipResult {
  isOwner: boolean;
  isOwnershipLoading: boolean;
  ownershipError: Error | null;
  refetchOwnership: () => void;
  accountAddress: string | null;
}

/**
 * Profile ownership hook mirroring the campaign ownership pattern.
 * TODO: Replace with Sui profile ownership verification once available.
 */
export function useProfileOwnership({
  profileAddress,
}: UseProfileOwnershipOptions = {}): UseProfileOwnershipResult {
  const account = useCurrentAccount();
  const normalizedProfileAddress = profileAddress?.trim() ?? null;

  const isOwner = useMemo(
    () =>
      deriveIsProfileOwner({
        currentAccountAddress: account?.address ?? null,
        profileAddress: normalizedProfileAddress,
      }),
    [account?.address, normalizedProfileAddress],
  );

  return {
    isOwner,
    isOwnershipLoading: false,
    ownershipError: null,
    refetchOwnership: () => {
      // Intentionally empty until Sui profile ownership logic is implemented.
    },
    accountAddress: account?.address ?? null,
  };
}
