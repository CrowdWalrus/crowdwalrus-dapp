import { useFormContext, Controller } from "react-hook-form";
import { FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Editor } from "@/components/blocks/editor-00/editor";
import { SerializedEditorState } from "lexical";

export function CampaignDetailsEditor() {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name="campaignDetails"
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const handleEditorChange = (serializedState: SerializedEditorState) => {
          onChange(JSON.stringify(serializedState));
        };

        const editorState = value ? JSON.parse(value) : undefined;

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
              editorSerializedState={editorState}
              onSerializedChange={handleEditorChange}
            />
            {error && <FormMessage>{error.message}</FormMessage>}
          </div>
        );
      }}
    />
  );
}
