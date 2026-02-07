import { useEffect, useState } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchWalrusBlob } from "@/services/walrus";

const STALE_TIME_MS = 5 * 60 * 1000;
const GC_TIME_MS = 10 * 60 * 1000;

/**
 * Fetches a Walrus-hosted image and exposes a cached object URL.
 */
export function useWalrusImage(
  imageUrl: string | null | undefined,
): UseQueryResult<string | null, Error> {
  const query = useQuery<Blob | null, Error>({
    queryKey: ["walrus-image", imageUrl],
    queryFn: async ({ signal }) => {
      if (!imageUrl) {
        return null;
      }

      return fetchWalrusBlob(imageUrl, {
        signal,
      });
    },
    enabled: Boolean(imageUrl),
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
    placeholderData: null,
  });

  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // Convert cached Blob into an object URL scoped to this hook instance.
  useEffect(() => {
    const blob = query.data;

    if (!blob) {
      setObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(blob);
    setObjectUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [query.data]);

  return {
    ...query,
    data: objectUrl,
  } as UseQueryResult<string | null, Error>;
}
