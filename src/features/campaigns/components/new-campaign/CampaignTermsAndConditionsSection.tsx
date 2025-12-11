import { useFormContext, Controller } from "react-hook-form";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import { FormMessage } from "@/shared/components/ui/form";
import { AlertCircleIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface CampaignTermsAndConditionsSectionProps {
  emphasizeRequiredNotice?: boolean;
}

export function CampaignTermsAndConditionsSection({
  emphasizeRequiredNotice = false,
}: CampaignTermsAndConditionsSectionProps) {
  const { control } = useFormContext();

  const requiredNoticeClasses = emphasizeRequiredNotice
    ? "text-red-600 font-semibold"
    : "text-neutral-700";

  return (
    <section
      className="mb-12 flex flex-col gap-4"
      data-field-error="termsAccepted"
    >
      <h3 className="text-base font-medium ">Terms and conditions</h3>

      <div className="flex flex-col gap-2">
        <Controller
          control={control}
          name="termsAccepted"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 h-6">
                <Checkbox
                  id="terms"
                  checked={value}
                  onCheckedChange={(checked) =>
                    onChange(checked as boolean)
                  }
                />
                <Label
                  htmlFor="terms"
                  className="cursor-pointer font-normal text-sm text-neutral-700 leading-[1.5]"
                >
                  By publishing your campaign on CrowdWalrus, you agree to our
                  [Terms and Conditions].
                </Label>
              </div>
              {error && <FormMessage>{error.message}</FormMessage>}
            </div>
          )}
        />

        <Alert
          className={cn(
            "p-4 gap-4 rounded-lg border-neutral-200",
            emphasizeRequiredNotice && "border-red-200 bg-red-50",
          )}
        >
          <AlertDescription
            className={cn(
              "text-sm leading-[1.5]",
              emphasizeRequiredNotice ? "text-red-600" : "text-neutral-700",
            )}
          >
            <span className="flex items-center gap-2">
              <AlertCircleIcon
                className={cn(
                  "mt-1",
                  emphasizeRequiredNotice ? "text-red-600" : undefined,
                )}
                size={16}
              />
              <span className={requiredNoticeClasses}>
                Fields marked with * are required.
              </span>
            </span>
          </AlertDescription>
        </Alert>
      </div>
    </section>
  );
}
