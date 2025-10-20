import { useEffect } from "react";

/**
 * Custom hook to set the document title
 * @param title - The page title (will be suffixed with "| CrowdWalrus")
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} | CrowdWalrus` : "CrowdWalrus";

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
