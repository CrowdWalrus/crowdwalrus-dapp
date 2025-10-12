import { useFormContext, Controller } from "react-hook-form";
import { FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Editor } from "@/shared/components/editor/blocks/editor-00/editor";
import { SerializedEditorState } from "lexical";

export interface CampaignDetailsEditorProps {
  disabled?: boolean;
  instanceKey?: number;
}

export function CampaignDetailsEditor({
  disabled = false,
  instanceKey,
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
            <div className="mb-4">
              <FormLabel htmlFor="campaign-details">
                Campaign details <span className="text-red-300">*</span>
              </FormLabel>
              <p className="text-sm text-muted-foreground mt-1">
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
