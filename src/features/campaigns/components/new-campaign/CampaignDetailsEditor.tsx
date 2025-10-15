import { useFormContext, Controller } from "react-hook-form";
import type { ReactNode } from "react";
import { FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Editor } from "@/shared/components/editor/blocks/editor-00/editor";
import { SerializedEditorState } from "lexical";
import { normalizeSerializedEditorState } from "@/shared/components/editor/utils/normalizeSerializedState";

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
          const normalizedState =
            normalizeSerializedEditorState(serializedState) ?? serializedState;
          onChange(JSON.stringify(normalizedState));
        };

        let editorState: SerializedEditorState | undefined;
        if (value) {
          try {
            const parsedState = JSON.parse(value) as SerializedEditorState;
            editorState =
              normalizeSerializedEditorState(parsedState) ?? parsedState;
          } catch (parseError) {
            console.warn(
              "Failed to parse campaign details editor state:",
              parseError,
            );
            editorState = undefined;
          }
        }

        return (
          <div>
            <div className="mb-4 flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <FormLabel
                  htmlFor="campaign-details"
                  className="font-medium text-base"
                >
                  Add campaign details <span className="text-red-300">*</span>
                </FormLabel>
                {(labelAction || labelStatus) && (
                  <div className="flex items-center gap-3">
                    {labelStatus}
                    {labelAction}
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground pb-4">
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
