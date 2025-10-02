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
    <div className="flex flex-col gap-8">
      <p className="font-bold text-2xl leading-[1.6]">
        <span>Select Category </span>
        <span className="font-normal text-[#f5827a]">*</span>
      </p>
      <div className="flex flex-col gap-4">
        <p className="font-medium text-base leading-[1.6]">
          Pick a category that best describes your campaign. You can select
          multiple category options.
        </p>
        <div className="flex gap-6">
          <div className="flex flex-col gap-6">
            <div className="flex gap-2 h-6 items-center w-60">
              <Checkbox
                id="arts"
                checked={value.includes("arts")}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("arts", checked as boolean)
                }
              />
              <Label
                htmlFor="arts"
                className="cursor-pointer font-normal text-sm leading-[1.5] text-neutral-700 tracking-[0.07px]"
              >
                Art & Culture
              </Label>
            </div>
            <div className="flex gap-2 h-6 items-center w-60">
              <Checkbox
                id="community"
                checked={value.includes("community")}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("community", checked as boolean)
                }
              />
              <Label
                htmlFor="community"
                className="cursor-pointer font-normal text-sm leading-[1.5] text-neutral-700 tracking-[0.07px]"
              >
                Community
              </Label>
            </div>
            <div className="flex gap-2 h-6 items-center w-60">
              <Checkbox
                id="education"
                checked={value.includes("education")}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("education", checked as boolean)
                }
              />
              <Label
                htmlFor="education"
                className="cursor-pointer font-normal text-sm leading-[1.5] text-neutral-700 tracking-[0.07px]"
              >
                Education
              </Label>
            </div>
            <div className="flex gap-2 h-6 items-center w-60">
              <Checkbox
                id="environment"
                checked={value.includes("environment")}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("environment", checked as boolean)
                }
              />
              <Label
                htmlFor="environment"
                className="cursor-pointer font-normal text-sm leading-[1.5] text-neutral-700 tracking-[0.07px]"
              >
                Environment & Energy
              </Label>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="flex gap-2 h-6 items-center w-60">
              <Checkbox
                id="health"
                checked={value.includes("health")}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("health", checked as boolean)
                }
              />
              <Label
                htmlFor="health"
                className="cursor-pointer font-normal text-sm leading-[1.5] text-neutral-700 tracking-[0.07px]"
              >
                Health & Wellness
              </Label>
            </div>
            <div className="flex gap-2 h-6 items-center w-60">
              <Checkbox
                id="ngo"
                checked={value.includes("ngo")}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("ngo", checked as boolean)
                }
              />
              <Label
                htmlFor="ngo"
                className="cursor-pointer font-normal text-sm leading-[1.5] text-neutral-700 tracking-[0.07px]"
              >
                NGO / NonProfits
              </Label>
            </div>
            <div className="flex gap-2 h-6 items-center w-60">
              <Checkbox
                id="tech"
                checked={value.includes("tech")}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("tech", checked as boolean)
                }
              />
              <Label
                htmlFor="tech"
                className="cursor-pointer font-normal text-sm leading-[1.5] text-neutral-700 tracking-[0.07px]"
              >
                Technology
              </Label>
            </div>
            <div className="flex gap-2 h-6 items-center w-60">
              <Checkbox
                id="other"
                checked={value.includes("other")}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("other", checked as boolean)
                }
              />
              <Label
                htmlFor="other"
                className="cursor-pointer font-normal text-sm leading-[1.5] text-neutral-700 tracking-[0.07px]"
              >
                Others
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
