import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";

interface CampaignCategorySelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function CampaignCategorySelector({
  value,
  onChange,
}: CampaignCategorySelectorProps) {
  const handleCheckboxChange = (category: string, checked: boolean) => {
    if (checked) {
      onChange([...value, category]);
    } else {
      onChange(value.filter((c) => c !== category));
    }
  };

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold mb-8">Select Category <span className="text-red-300">*</span></h2>
      <p className="text-muted-foreground mb-6">
        Pick a category that best describes your campaign. You can select
        multiple category options.
      </p>

      <div className="grid grid-cols-2 gap-x-6 gap-y-6">
        {/* Column 1 */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="tech"
              checked={value.includes("tech")}
              onCheckedChange={(checked) =>
                handleCheckboxChange("tech", checked as boolean)
              }
            />
            <Label htmlFor="tech" className="cursor-pointer font-normal">
              Technology
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="education"
              checked={value.includes("education")}
              onCheckedChange={(checked) =>
                handleCheckboxChange("education", checked as boolean)
              }
            />
            <Label htmlFor="education" className="cursor-pointer font-normal">
              Education
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="community"
              checked={value.includes("community")}
              onCheckedChange={(checked) =>
                handleCheckboxChange("community", checked as boolean)
              }
            />
            <Label htmlFor="community" className="cursor-pointer font-normal">
              Community
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="health"
              checked={value.includes("health")}
              onCheckedChange={(checked) =>
                handleCheckboxChange("health", checked as boolean)
              }
            />
            <Label htmlFor="health" className="cursor-pointer font-normal">
              Health
            </Label>
          </div>
        </div>

        {/* Column 2 */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="environment"
              checked={value.includes("environment")}
              onCheckedChange={(checked) =>
                handleCheckboxChange("environment", checked as boolean)
              }
            />
            <Label htmlFor="environment" className="cursor-pointer font-normal">
              Environment
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="arts"
              checked={value.includes("arts")}
              onCheckedChange={(checked) =>
                handleCheckboxChange("arts", checked as boolean)
              }
            />
            <Label htmlFor="arts" className="cursor-pointer font-normal">
              Arts
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sports"
              checked={value.includes("sports")}
              onCheckedChange={(checked) =>
                handleCheckboxChange("sports", checked as boolean)
              }
            />
            <Label htmlFor="sports" className="cursor-pointer font-normal">
              Sports
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="other"
              checked={value.includes("other")}
              onCheckedChange={(checked) =>
                handleCheckboxChange("other", checked as boolean)
              }
            />
            <Label htmlFor="other" className="cursor-pointer font-normal">
              Other
            </Label>
          </div>
        </div>
      </div>
    </section>
  );
}
