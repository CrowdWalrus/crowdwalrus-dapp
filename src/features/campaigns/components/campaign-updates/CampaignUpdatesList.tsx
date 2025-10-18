import { format } from "date-fns";
import { ArrowBigRight } from "lucide-react";
import { SerializedEditorState } from "lexical";

import { useWalrusDescription } from "@/features/campaigns/hooks/useWalrusDescription";
import type { CampaignUpdate } from "@/features/campaigns/types/campaignUpdate";
import { EditorViewer } from "@/shared/components/editor/blocks/editor-00/viewer";
import { lexicalToSummary } from "@/shared/utils/lexical";

interface CampaignUpdatesListProps {
  updates: CampaignUpdate[];
}

interface CampaignUpdateItemProps {
  update: CampaignUpdate;
}

function CampaignUpdateItem({ update }: CampaignUpdateItemProps) {
  const {
    data: content,
    isLoading,
    isFetching,
    isPlaceholderData,
    error,
  } = useWalrusDescription(update.walrusContentUrl);

  const isWalrusContentLoading =
    (isLoading || isFetching || isPlaceholderData) && !content;

  let editorState: SerializedEditorState | null = null;
  if (content) {
    try {
      editorState = JSON.parse(content);
    } catch (parseError) {
      console.warn("Failed to parse update content JSON:", parseError);
    }
  }

  const fallbackSummary = content ? lexicalToSummary(content) : "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm">
        <ArrowBigRight className="text-primary" size="24" />
        <span className="font-semibold">
          {format(new Date(update.createdAtMs || Date.now()), "MMMM d, yyyy")}
        </span>
      </div>

      <div className="pl-6">
        {isWalrusContentLoading ? (
          <div className="flex flex-col gap-3 pb-10">
            <div className="h-4 w-2/3 rounded bg-black-50 animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-black-50 animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-black-50 animate-pulse" />
          </div>
        ) : editorState ? (
          <EditorViewer editorSerializedState={editorState} />
        ) : fallbackSummary ? (
          <p className="text-sm text-black-400 whitespace-pre-line">
            {fallbackSummary}
          </p>
        ) : error ? (
          <p className="text-sm text-red-500">
            Failed to load update content
            {error.message ? `: ${error.message}` : ""}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No content available for this update.
          </p>
        )}
      </div>
    </div>
  );
}

export function CampaignUpdatesList({ updates }: CampaignUpdatesListProps) {
  if (updates.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <h2 className="font-['Inter_Tight'] text-[26px] font-bold text-black-500">
          Updates (0)
        </h2>
        <p className="text-sm text-muted-foreground">
          No updates have been posted yet. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-['Inter_Tight'] text-[26px] font-bold text-black-500">
        Updates ({updates.length})
      </h2>

      <div className="flex flex-col gap-10">
        {updates.map((update) => (
          <CampaignUpdateItem key={update.updateId} update={update} />
        ))}
      </div>
    </div>
  );
}
