import { useFormContext, Controller } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { FormMessage } from "@/shared/components/ui/form";

export function CampaignTypeSelector() {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name="campaignType"
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <section className="flex flex-col gap-8">
          <h2 className="text-2xl font-bold leading-[1.6]">
            Campaign Type <span className="text-red-300">*</span>
          </h2>

          <RadioGroup
            value={value}
            onValueChange={onChange}
            className="flex gap-6"
          >
        <label
          htmlFor="nonprofit"
          className="flex items-start gap-2 bg-white border border-border rounded-[10px] px-3 py-2 cursor-pointer hover:border-neutral-300 transition-colors flex-1"
        >
          <div className="pt-[2.5px]">
            <RadioGroupItem value="nonprofit" id="nonprofit" />
          </div>
          <div className="flex flex-col gap-0">
            <span className="text-sm leading-[1.5] font-normal text-[#404040] tracking-[0.07px]">
              Non-Profit
            </span>
            <span className="text-xs leading-[1.5] font-normal text-[#737373] tracking-[0.18px]">
              100% of donations go to your cause.
            </span>
          </div>
        </label>

        <label
          htmlFor="commercial"
          className="flex items-start gap-2 bg-white border border-border rounded-[10px] px-3 py-2 cursor-pointer hover:border-neutral-300 transition-colors flex-1"
        >
          <div className="pt-[2.5px]">
            <RadioGroupItem value="commercial" id="commercial" />
          </div>
          <div className="flex flex-col gap-0">
            <span className="text-sm leading-[1.5] font-normal text-[#404040] tracking-[0.07px]">
              Commercial
            </span>
            <span className="text-xs leading-[1.5] font-normal text-[#737373] tracking-[0.18px]">
              You'll be charged a 5% platform fee on funds raised.
            </span>
          </div>
        </label>
          </RadioGroup>
          {error && <FormMessage>{error.message}</FormMessage>}
        </section>
      )}
    />
  );
}
