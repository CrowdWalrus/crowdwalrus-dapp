/**
 * Campaign About Component
 * Campaign description with image gallery
 */

import { EditorViewer } from "@/shared/components/editor/blocks/editor-00/viewer";
import { SerializedEditorState } from "lexical";

interface CampaignAboutProps {
  description: string;
  images?: string[];
}

export function CampaignAbout({ description, images = [] }: CampaignAboutProps) {
  // Parse description as editor state
  let editorState: SerializedEditorState | null = null;
  try {
    editorState = JSON.parse(description);
  } catch (error) {
    console.error("Failed to parse description JSON:", error);
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Section Title */}
      <h2 className="font-['Inter_Tight'] text-[26px] font-bold leading-[1.2] tracking-[0.26px] text-[#0c0f1c]">
        About this campaign
      </h2>

      <div className="flex flex-col gap-6 w-full">
        {/* Image Gallery */}
        {images.length > 0 && (
          <div className="flex items-center gap-4 w-full">
            {images.slice(0, 3).map((image, index) => (
              <div
                key={index}
                className="flex-1 aspect-[856/432] rounded-[16px] overflow-hidden bg-muted"
              >
                <img
                  src={image}
                  alt={`Campaign image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Description */}
        <div className="font-['Inter'] text-base font-normal leading-[1.6] text-[#3d3f49]">
          {editorState ? (
            <EditorViewer editorSerializedState={editorState} />
          ) : (
            <p className="text-red-600">Failed to load description content</p>
          )}
        </div>
      </div>
    </div>
  );
}
