import { useCallback, useMemo } from "react";
import {
  useCurrentAccount,
  useSuiClientQuery,
} from "@mysten/dapp-kit";

import { getContractConfig } from "@/shared/config/contracts";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";

type SupportedNetwork = "devnet" | "testnet" | "mainnet";

interface AdminCapFields {
  crowd_walrus_id?: string;
  crowdWalrusId?: string;
  id?: { id?: string };
}

interface VerifyCapFields {
  crowd_walrus_id?: string;
  crowdWalrusId?: string;
  id?: { id?: string };
}

const isMoveObjectContent = (
  content: unknown,
): content is { dataType: "moveObject"; fields?: Record<string, unknown> } =>
  typeof content === "object" &&
  content !== null &&
  (content as { dataType?: unknown }).dataType === "moveObject";

const normalizeId = (value?: string): string =>
  typeof value === "string" ? value.toLowerCase() : "";

export interface UseCrowdWalrusAdminCapsOptions {
  network?: SupportedNetwork;
}

export interface UseCrowdWalrusAdminCapsResult {
  adminCapId: string | null;
  verifyCapIds: string[];
  primaryVerifyCapId: string | null;
  hasAdminCap: boolean;
  hasVerifierAccess: boolean;
  accountAddress: string | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCrowdWalrusAdminCaps(
  options: UseCrowdWalrusAdminCapsOptions = {},
): UseCrowdWalrusAdminCapsResult {
  const network = options.network ?? DEFAULT_NETWORK;
  const account = useCurrentAccount();
  const config = getContractConfig(network);
  const ownerAddress = account?.address ?? "";
  const normalizedCrowdWalrusId = normalizeId(
    config.contracts.crowdWalrusObjectId,
  );

  const adminQueryEnabled = Boolean(ownerAddress);
  const verifyQueryEnabled = Boolean(ownerAddress);

  const {
    data: adminCapsData,
    isPending: isAdminCapsPending,
    error: adminCapsError,
    refetch: refetchAdminCaps,
  } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: ownerAddress,
      filter: {
        StructType: `${config.contracts.packageId}::crowd_walrus::AdminCap`,
      },
      options: {
        showContent: true,
      },
    },
    {
      enabled: adminQueryEnabled,
    },
  );

  const {
    data: verifyCapsData,
    isPending: isVerifyCapsPending,
    error: verifyCapsError,
    refetch: refetchVerifyCaps,
  } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: ownerAddress,
      filter: {
        StructType: `${config.contracts.packageId}::crowd_walrus::VerifyCap`,
      },
      options: {
        showContent: true,
      },
    },
    {
      enabled: verifyQueryEnabled,
    },
  );

  const adminCapId = useMemo(() => {
    if (!adminCapsData?.data) {
      return null;
    }

    for (const item of adminCapsData.data) {
      const objectData = item.data;
      const content = objectData?.content;
      if (!isMoveObjectContent(content)) {
        continue;
      }

      const fields = content.fields as AdminCapFields;
      const capCrowdWalrusId =
        normalizeId(fields.crowd_walrus_id ?? fields.crowdWalrusId);

      if (capCrowdWalrusId === normalizedCrowdWalrusId) {
        return objectData?.objectId ?? fields.id?.id ?? null;
      }
    }

    return null;
  }, [adminCapsData, normalizedCrowdWalrusId]);

  const verifyCapIds = useMemo(() => {
    if (!verifyCapsData?.data) {
      return [];
    }

    const ids: string[] = [];

    for (const item of verifyCapsData.data) {
      const objectData = item.data;
      const content = objectData?.content;
      if (!isMoveObjectContent(content)) {
        continue;
      }

      const fields = content.fields as VerifyCapFields;
      const capCrowdWalrusId =
        normalizeId(fields.crowd_walrus_id ?? fields.crowdWalrusId);

      if (capCrowdWalrusId === normalizedCrowdWalrusId) {
        const objectId = objectData?.objectId ?? fields.id?.id ?? null;
        if (objectId) {
          ids.push(objectId);
        }
      }
    }

    return ids;
  }, [verifyCapsData, normalizedCrowdWalrusId]);

  const refetch = useCallback(() => {
    refetchAdminCaps();
    refetchVerifyCaps();
  }, [refetchAdminCaps, refetchVerifyCaps]);

  const error =
    (adminCapsError instanceof Error ? adminCapsError : null) ??
    (verifyCapsError instanceof Error ? verifyCapsError : null);

  return {
    adminCapId,
    verifyCapIds,
    primaryVerifyCapId: verifyCapIds[0] ?? null,
    hasAdminCap: Boolean(adminCapId),
    hasVerifierAccess: verifyCapIds.length > 0,
    accountAddress: account?.address ?? null,
    isLoading: isAdminCapsPending || isVerifyCapsPending,
    error,
    refetch,
  };
}
