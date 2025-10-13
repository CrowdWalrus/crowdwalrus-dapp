import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import type { ReactNode } from "react";
import { Plus, X } from "lucide-react";
import { SOCIAL_PLATFORM_CONFIG } from "@/features/campaigns/constants/socialPlatforms";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

interface CampaignSocialsSectionProps {
  disabled?: boolean;
  labelAction?: ReactNode;
  labelStatus?: ReactNode;
}

export function CampaignSocialsSection({
  disabled = false,
  labelAction,
  labelStatus,
}: CampaignSocialsSectionProps) {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "socials",
  });

  const handleAddMore = () => {
    if (disabled) {
      return;
    }
    append({ platform: "website", url: "" });
  };

  const socials = watch("socials");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-medium text-base leading-[1.6]">Add socials</p>
        {(labelAction || labelStatus) && (
          <div className="flex items-center gap-3">
            {labelStatus}
            {labelAction}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4 w-full">
        {fields.map((field, index) => {
          const platformValue = socials?.[index]?.platform || "website";
          const config =
            SOCIAL_PLATFORM_CONFIG[platformValue as keyof typeof SOCIAL_PLATFORM_CONFIG];

          const urlError = (errors?.socials as any)?.[index]?.url;

          return (
            <div key={field.id} className="flex flex-col gap-2 w-full">
              <div className="flex gap-4 items-start w-full">
                <Controller
                  control={control}
                  name={`socials.${index}.platform`}
                  render={({ field: controllerField }) => (
                    <Select
                      value={controllerField.value}
                      onValueChange={controllerField.onChange}
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-40" disabled={disabled}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SOCIAL_PLATFORM_CONFIG).map(
                          ([value, config]) => {
                            const ItemIcon = config.icon;
                            return (
                              <SelectItem key={value} value={value}>
                                <div className="flex gap-3 items-center">
                                  {ItemIcon ? (
                                    <ItemIcon className="size-5 shrink-0" />
                                  ) : (
                                    <div className="size-5 shrink-0" />
                                  )}
                                  <span>{config.label}</span>
                                </div>
                              </SelectItem>
                            );
                          },
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                <div className="flex-1 flex flex-col gap-2">
                  <Controller
                    control={control}
                    name={`socials.${index}.url`}
                    render={({ field: controllerField }) => (
                      <Input
                        placeholder={config?.placeholder || "https://"}
                        className="w-full"
                        {...controllerField}
                        disabled={disabled}
                      />
                    )}
                  />
                  {urlError && (
                    <p className="text-sm font-medium text-destructive">
                      {urlError.message as string}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => !disabled && remove(index)}
                  className="shrink-0 size-5 flex items-center justify-center text-red-300 hover:text-red-400 transition-colors mt-3 disabled:opacity-50"
                  disabled={disabled}
                >
                  <X className="size-[15.417px]" />
                </button>
              </div>
            </div>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          className="w-40"
          onClick={handleAddMore}
          disabled={disabled}
          type="button"
        >
          <Plus className="size-[13.25px]" />
          Add more
        </Button>
      </div>
    </div>
  );
}
