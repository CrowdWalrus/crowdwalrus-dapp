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

const CATEGORY_GROUPS = [
  [
    { id: "arts", label: "Art & Culture" },
    { id: "community", label: "Community" },
    { id: "education", label: "Education" },
    { id: "environment", label: "Environment & Energy" },
  ],
  [
    { id: "health", label: "Health & Wellness" },
    { id: "ngo", label: "NGO / Nonprofits" },
    { id: "tech", label: "Technology" },
    { id: "other", label: "Others" },
  ],
];

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
      onChange(currentValue.filter((value) => value !== category));
    }
  };

  return (
    <Controller
      control={control}
      name="categories"
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const selectedCategories = Array.isArray(value) ? value : [];

        return (
          <div
            className="flex flex-col gap-8"
            data-field-error="categories"
          >
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
                Pick a category that best describes your campaign. You can
                choose multiple options.
              </p>
              <div className="flex gap-6">
                {CATEGORY_GROUPS.map((group, groupIndex) => (
                  <div key={groupIndex} className="flex flex-col gap-6">
                    {group.map(({ id, label }) => (
                      <div
                        key={id}
                        className="flex gap-2 h-6 items-center w-60"
                      >
                        <Checkbox
                          id={id}
                          checked={selectedCategories.includes(id)}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(
                              id,
                              checked as boolean,
                              selectedCategories,
                              onChange,
                            )
                          }
                          disabled={disabled}
                        />
                        <Label
                          htmlFor={id}
                          className="cursor-pointer font-normal text-sm leading-[1.5] text-neutral-700 tracking-[0.07px]"
                        >
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              {error && <FormMessage>{error.message}</FormMessage>}
            </div>
          </div>
        );
      }}
    />
  );
}
