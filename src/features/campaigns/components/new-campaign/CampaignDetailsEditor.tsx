import { useFormContext, Controller } from "react-hook-form";
import type { ReactNode } from "react";
import { FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Editor } from "@/shared/components/editor/blocks/editor-00/editor";
import { SerializedEditorState } from "lexical";

export interface CampaignDetailsEditorProps {
  disabled?: boolean;
  instanceKey?: number;
  labelAction?: ReactNode;
  labelStatus?: ReactNode;
}

export function CampaignDetailsEditor({
  disabled = false,
  instanceKey,
  labelAction,
  labelStatus,
}: CampaignDetailsEditorProps) {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name="campaignDetails"
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const handleEditorChange = (serializedState: SerializedEditorState) => {
          onChange(JSON.stringify(serializedState));
        };

        let editorState: SerializedEditorState | undefined;
        if (value) {
          try {
            editorState = JSON.parse(value);
          } catch (parseError) {
            console.warn("Failed to parse campaign details editor state:", parseError);
            editorState = undefined;
          }
        }

        return (
          <div>
            <div className="mb-4 flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <FormLabel htmlFor="campaign-details">
                  Campaign details <span className="text-red-300">*</span>
                </FormLabel>
                {(labelAction || labelStatus) && (
                  <div className="flex items-center gap-3">
                    {labelStatus}
                    {labelAction}
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Add a detailed campaign description, images, links, and
                attachments.
              </p>
            </div>
            <Editor
              key={instanceKey ?? 0}
              editorSerializedState={editorState}
              onSerializedChange={handleEditorChange}
              readOnly={disabled}
            />
            {error && <FormMessage>{error.message}</FormMessage>}
          </div>
        );
      }}
    />
  );
}
