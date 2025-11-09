import { useFormContext, Controller } from "react-hook-form";
import type { ReactNode } from "react";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { FormMessage } from "@/shared/components/ui/form";
import { cn } from "@/shared/lib/utils";
import { usePolicyPresets } from "@/features/campaigns/hooks/usePolicyPresets";

interface CampaignTypeSelectorProps {
  disabled?: boolean;
  headerAction?: ReactNode;
  headerStatus?: ReactNode;
}

export function CampaignTypeSelector({
  disabled = false,
  headerAction,
  headerStatus,
}: CampaignTypeSelectorProps) {
  const { control } = useFormContext();
  const {
    data: policyPresets,
    isLoading,
    isError,
  } = usePolicyPresets();

  return (
    <Controller
      control={control}
      name="campaignType"
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const noPresets = policyPresets.length === 0;
        const isSelectorDisabled = disabled || isLoading || noPresets;

        return (
          <section className="flex flex-col gap-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-bold leading-[1.6]">
                Campaign Type <span className="text-red-300">*</span>
              </h2>
              {(isLoading || isError || headerStatus || headerAction) && (
                <div className="flex items-center gap-3">
                  {isLoading && (
                    <span className="text-sm text-muted-foreground">
                      Loading policies…
                    </span>
                  )}
                  {isError && (
                    <span className="text-sm text-red-500">
                      Failed to load policies
                    </span>
                  )}
                  {headerStatus}
                  {headerAction}
                </div>
              )}
            </div>

            <RadioGroup
              value={value}
              onValueChange={(nextValue) => {
                if (isSelectorDisabled) {
                  return;
                }
                onChange(nextValue);
              }}
              className={cn(
                "flex gap-6",
                isSelectorDisabled && "opacity-60",
              )}
              aria-disabled={isSelectorDisabled}
            >
              {policyPresets.map((preset) => {
                const inputId = `campaign-type-${preset.name}`;
                return (
                  <label
                    key={preset.name}
                    htmlFor={inputId}
                    className={cn(
                      "flex flex-1 items-start gap-2 rounded-[10px] border border-border bg-white px-3 py-2 transition-colors hover:border-neutral-300",
                      isSelectorDisabled ? "cursor-not-allowed" : "cursor-pointer",
                    )}
                  >
                    <div className="pt-[2.5px]">
                      <RadioGroupItem
                        value={preset.name}
                        id={inputId}
                        disabled={isSelectorDisabled}
                      />
                    </div>
                      <div className="flex flex-col gap-0">
                        <span className="text-sm font-normal leading-[1.5] tracking-[0.07px] text-[#404040]">
                          {preset.label}
                        </span>
                        <span className="text-xs font-normal leading-[1.5] tracking-[0.18px] text-[#737373]">
                          {preset.description}
                        </span>
                      </div>
                  </label>
                );
              })}
            </RadioGroup>
            {error && <FormMessage>{error.message}</FormMessage>}
          </section>
        );
      }}
    />
  );
}
