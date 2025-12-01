import { useEffect, useState } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";

const STALE_TIME_MS = 5 * 60 * 1000;
const GC_TIME_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 30 * 1000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB ceiling to prevent runaway blobs

/**
 * Fetches a Walrus-hosted image and exposes a cached object URL.
 */
export function useWalrusImage(
  imageUrl: string | null | undefined,
): UseQueryResult<string | null, Error> {
  const query = useQuery<Blob | null, Error>({
    queryKey: ["walrus-image", imageUrl],
    queryFn: async () => {
      if (!imageUrl) {
        return null;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      let response: Response;
      try {
        response = await fetch(imageUrl, {
          mode: "cors",
          signal: controller.signal,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          throw new Error("Timed out while fetching Walrus image");
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const contentLengthHeader = response.headers.get("content-length");
      if (contentLengthHeader) {
        const contentLength = Number.parseInt(contentLengthHeader, 10);
        if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
          throw new Error("Walrus image exceeds maximum allowed size (10 MB)");
        }
      }

      const blob = await response.blob();
      if (blob.size > MAX_IMAGE_BYTES) {
        throw new Error("Walrus image exceeds maximum allowed size (10 MB)");
      }

      return blob;
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
