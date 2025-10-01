import { Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

export interface Social {
  platform: string;
  url: string;
}

interface CampaignSocialsSectionProps {
  value: Social[];
  onChange: (socials: Social[]) => void;
}

export function CampaignSocialsSection({
  value,
  onChange,
}: CampaignSocialsSectionProps) {
  const handleAddMore = () => {
    onChange([...value, { platform: "website", url: "" }]);
  };

  const handlePlatformChange = (index: number, platform: string) => {
    const newSocials = [...value];
    newSocials[index].platform = platform;
    onChange(newSocials);
  };

  const handleUrlChange = (index: number, url: string) => {
    const newSocials = [...value];
    newSocials[index].url = url;
    onChange(newSocials);
  };

  return (
    <div className="mb-10">
      <h3 className="text-lg font-medium mb-6">Add socials</h3>
      <div className="space-y-4">
        {value.map((social, index) => (
          <div key={index} className="flex gap-4">
            <Select
              value={social.platform}
              onValueChange={(platform) => handlePlatformChange(index, platform)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="https://"
              className="flex-1"
              value={social.url}
              onChange={(e) => handleUrlChange(index, e.target.value)}
            />
          </div>
        ))}

        <Button
          variant="outline"
          size="sm"
          className="w-40"
          onClick={handleAddMore}
          type="button"
        >
          <Plus className="h-4 w-4" />
          Add more
        </Button>
      </div>
    </div>
  );
}
