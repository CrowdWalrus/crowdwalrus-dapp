import {
  useFormContext,
  useFieldArray,
  Controller,
  type FieldError,
} from "react-hook-form";
import { useEffect, type ReactNode } from "react";
import { Plus, X } from "lucide-react";
import {
  MAX_SOCIAL_LINKS,
  SOCIAL_PLATFORM_CONFIG,
} from "@/features/campaigns/constants/socialPlatforms";
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
  maxSocials?: number;
}

type SocialField = {
  platform: string;
  url?: string;
};

type SocialFormValues = {
  socials: SocialField[];
};

export function CampaignSocialsSection({
  disabled = false,
  labelAction,
  labelStatus,
  maxSocials = MAX_SOCIAL_LINKS,
}: CampaignSocialsSectionProps) {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext<SocialFormValues>();
  const { fields, append, remove, replace } = useFieldArray<SocialFormValues>({
    control,
    name: "socials",
  });

  const socials = watch("socials");
  const socialCount = socials?.length ?? 0;
  const isAtLimit = socialCount >= maxSocials;

  useEffect(() => {
    // Keep field array in sync with async resets/navigation to avoid blank rows.
    if (!Array.isArray(socials)) {
      return;
    }
    const normalized = socials.filter(
      (entry) => entry && entry.platform,
    );
    if (
      normalized.length !== socials.length ||
      normalized.length !== fields.length
    ) {
      replace(normalized);
    }
  }, [fields.length, replace, socials]);

  const handleAddMore = () => {
    if (disabled || isAtLimit) {
      return;
    }
    append({ platform: "website", url: "" });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-medium text-base leading-[1.6]">
          Add your campaign's social links.
        </p>
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
            SOCIAL_PLATFORM_CONFIG[
              platformValue as keyof typeof SOCIAL_PLATFORM_CONFIG
            ];

          const urlError = errors.socials?.[index]?.url as
            | FieldError
            | undefined;

          return (
            <div key={field.id} className="flex flex-col gap-2 w-full">
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-start w-full">
                <Controller
                  control={control}
                  name={`socials.${index}.platform`}
                  render={({ field: controllerField }) => (
                    <Select
                      value={controllerField.value}
                      onValueChange={controllerField.onChange}
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-full sm:w-40" disabled={disabled}>
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
                <div className="flex-1 flex gap-2 items-start w-full">
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
            </div>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-40"
          onClick={handleAddMore}
          disabled={disabled || isAtLimit}
          type="button"
        >
          <Plus className="size-[13.25px]" />
          Add more
        </Button>
        <p className="text-xs text-muted-foreground">
          {isAtLimit
            ? `You have added the maximum of ${maxSocials} social links.`
            : `You can add up to ${maxSocials} social links (${socialCount}/${maxSocials}).`}
        </p>
      </div>
    </div>
  );
}
