import { useFormContext, Controller } from "react-hook-form";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import { FormMessage } from "@/shared/components/ui/form";
import { AlertCircleIcon } from "lucide-react";

export function CampaignTermsAndConditionsSection() {
  const { control } = useFormContext();

  return (
    <section className="mb-12 flex flex-col gap-4">
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
                  By publishing campaign at CrowdWalrus you agree to our Terms
                  and Conditions.
                </Label>
              </div>
              {error && <FormMessage>{error.message}</FormMessage>}
            </div>
          )}
        />

        <Alert className="p-4 gap-4 rounded-lg border-neutral-200">
          <AlertDescription className="text-sm text-neutral-700 leading-[1.5]">
            <span className="flex items-center gap-2">
              <AlertCircleIcon className="mt-1" size={16} />
              <span>Fields marked as * are mandatory to fill.</span>
            </span>
          </AlertDescription>
        </Alert>
      </div>
    </section>
  );
}
