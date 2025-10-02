import { Label } from "@/shared/components/ui/label";
import { Editor } from "@/components/blocks/editor-00/editor";
import { SerializedEditorState } from "lexical";

interface CampaignDetailsEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CampaignDetailsEditor({
  value,
  onChange,
}: CampaignDetailsEditorProps) {
  const handleEditorChange = (serializedState: SerializedEditorState) => {
    onChange(JSON.stringify(serializedState));
  };

  const editorState = value ? JSON.parse(value) : undefined;

  console.log("editorState", value);

  return (
    <div>
      <div className="mb-4">
        <Label htmlFor="campaign-details">
          Campaign details <span className="text-red-300">*</span>
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          Add a detailed campaign description, images, links, and attachments.
        </p>
      </div>
      <Editor
        editorSerializedState={editorState}
        onSerializedChange={handleEditorChange}
      />
    </div>
  );
}
