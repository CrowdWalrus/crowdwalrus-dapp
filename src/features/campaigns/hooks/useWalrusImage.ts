import { useEffect } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";

const STALE_TIME_MS = 5 * 60 * 1000;
const GC_TIME_MS = 10 * 60 * 1000;

/**
 * Fetches a Walrus-hosted image and exposes a cached object URL.
 */
export function useWalrusImage(
  imageUrl: string | null | undefined,
): UseQueryResult<string | null, Error> {
  const query = useQuery<string | null, Error>({
    queryKey: ["walrus-image", imageUrl],
    queryFn: async () => {
      if (!imageUrl) {
        return null;
      }

      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    },
    enabled: Boolean(imageUrl),
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
    placeholderData: null,
  });

  useEffect(() => {
    const objectUrl = query.data;
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [query.data]);

  return query;
}
