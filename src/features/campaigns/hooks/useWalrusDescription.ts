import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchWalrusText } from "@/services/walrus";

const STALE_TIME_MS = 5 * 60 * 1000;
const GC_TIME_MS = 10 * 60 * 1000;

/**
 * Fetches a campaign description from Walrus storage and caches it.
 */
export function useWalrusDescription(
  descriptionUrl: string | null | undefined,
): UseQueryResult<string, Error> {
  return useQuery<string, Error>({
    queryKey: ["walrus-description", descriptionUrl],
    queryFn: async ({ signal }) => {
      if (!descriptionUrl) {
        return "";
      }

      return fetchWalrusText(descriptionUrl, {
        signal,
      });
    },
    enabled: Boolean(descriptionUrl),
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
    placeholderData: "",
  });
}
