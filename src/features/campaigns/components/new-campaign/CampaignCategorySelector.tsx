import { useFormContext, Controller } from "react-hook-form";
import type { ReactNode } from "react";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import { FormMessage } from "@/shared/components/ui/form";

interface CampaignCategorySelectorProps {
  disabled?: boolean;
  headerAction?: ReactNode;
  headerStatus?: ReactNode;
}

export function CampaignCategorySelector({
  disabled = false,
  headerAction,
  headerStatus,
}: CampaignCategorySelectorProps) {
  const { control } = useFormContext();

  const handleCheckboxChange = (
    category: string,
    checked: boolean,
    currentValue: string[],
    onChange: (value: string[]) => void,
  ) => {
    if (checked) {
      onChange([...currentValue, category]);
    } else {
      onChange(currentValue.filter((c) => c !== category));
    }
  };

  return (
    <Controller
      control={control}
      name="categories"
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-bold text-2xl leading-[1.6]">
              <span>Select Category </span>
              <span className="font-normal text-red-300">*</span>
            </p>
            {(headerAction || headerStatus) && (
              <div className="flex items-center gap-3">
                {headerStatus}
                {headerAction}
              </div>
            )}
          </div>
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
                    handleCheckboxChange("arts", checked as boolean, value, onChange)
                  }
                  disabled={disabled}
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
                    handleCheckboxChange("community", checked as boolean, value, onChange)
                  }
                  disabled={disabled}
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
                    handleCheckboxChange("education", checked as boolean, value, onChange)
                  }
                  disabled={disabled}
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
                    handleCheckboxChange("environment", checked as boolean, value, onChange)
                  }
                  disabled={disabled}
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
                    handleCheckboxChange("health", checked as boolean, value, onChange)
                  }
                  disabled={disabled}
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
                    handleCheckboxChange("ngo", checked as boolean, value, onChange)
                  }
                  disabled={disabled}
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
                    handleCheckboxChange("tech", checked as boolean, value, onChange)
                  }
                  disabled={disabled}
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
                    handleCheckboxChange("other", checked as boolean, value, onChange)
                  }
                  disabled={disabled}
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
            {error && <FormMessage>{error.message}</FormMessage>}
          </div>
        </div>
      )}
    />
  );
}
