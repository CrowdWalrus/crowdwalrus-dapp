import { useFormContext } from "react-hook-form";
import { Input } from "@/shared/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { DollarSign } from "lucide-react";

export function CampaignFundingTargetSection() {
  const { control } = useFormContext();

  return (
    <section className="flex flex-col gap-8">
      <h2 className="font-bold text-2xl leading-[1.6]">
        Funding Target <span className="font-normal text-red-300">*</span>
      </h2>

      <div className="flex flex-col gap-8">
        <FormField
          control={control}
          name="targetAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-medium text-base leading-[1.6]">
                Add a max funding amount for your campaign
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#737373]" />
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    className="pl-12"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="walletAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-medium text-base leading-[1.6]">
                Add a funding Sui address
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="0x8894E0a0c962CB723c1976a4421c95949bE2D4E3"
                  {...field}
                />
              </FormControl>
              <p className="font-normal text-xs leading-[1.6] text-[#8f9197]">
                This is the wallet that will receive all donation funds
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </section>
  );
}
