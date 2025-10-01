import { Label } from "@/shared/components/ui/label";

interface CampaignDetailsEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CampaignDetailsEditor({}: CampaignDetailsEditorProps) {
  return (
    <div>
      <div className="mb-4">
        <Label htmlFor="campaign-details">Campaign details *</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Add a detailed campaign description, images, links, and attachments.
        </p>
      </div>
      <div className="border border-border rounded-lg p-4 bg-muted/30 min-h-[400px]">
        <p className="text-muted-foreground">Rich text editor placeholder</p>
      </div>
    </div>
  );
}
