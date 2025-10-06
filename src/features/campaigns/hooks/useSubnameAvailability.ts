import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSuiClient } from "@mysten/dapp-kit";

import { useNetworkVariable } from "@/shared/config/networkConfig";
import { formatSubdomain } from "@/shared/utils/subdomain";

export type SubnameAvailabilityStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "error";

interface UseSubnameAvailabilityResult {
  status: SubnameAvailabilityStatus;
  fullName: string;
  campaignDomain: string | undefined;
  isAvailable: boolean;
  isTaken: boolean;
  isChecking: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

/**
 * Check the availability of a SuiNS sub-name using the active network.
 * Returns the status alongside the fully qualified name (label + campaign domain).
 */
export function useSubnameAvailability(
  subname: string | null | undefined,
): UseSubnameAvailabilityResult {
  const suiClient = useSuiClient();
  const campaignDomain = useNetworkVariable("campaignDomain") as
    | string
    | undefined;

  const normalizedInput = subname?.trim() ?? "";
  const hasDomain = typeof campaignDomain === "string" && campaignDomain.length > 0;
  const shouldCheck = hasDomain && normalizedInput.length > 0;

  const fullName = useMemo(() => {
    if (!shouldCheck || !campaignDomain) {
      return "";
    }

    return formatSubdomain(normalizedInput, campaignDomain);
  }, [campaignDomain, normalizedInput, shouldCheck]);

  const query = useQuery({
    queryKey: ["subname-availability", campaignDomain, normalizedInput],
    queryFn: async () => {
      if (!fullName) {
        return null;
      }

      return await suiClient.resolveNameServiceAddress({ name: fullName });
    },
    enabled: shouldCheck,
    retry: shouldCheck ? 2 : false,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const isChecking = query.isFetching || query.isPending;

  let status: SubnameAvailabilityStatus = "idle";

  if (!shouldCheck) {
    status = "idle";
  } else if (isChecking) {
    status = "checking";
  } else if (query.isError) {
    status = "error";
  } else if (query.data) {
    status = "taken";
  } else {
    status = "available";
  }

  return {
    status,
    fullName,
    campaignDomain,
    isAvailable: status === "available",
    isTaken: status === "taken",
    isChecking,
    error: (query.error as Error) ?? null,
    refetch: query.refetch,
  };
}
