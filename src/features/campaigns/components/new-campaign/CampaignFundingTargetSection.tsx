import { useFormContext } from "react-hook-form";
import type { ReactNode } from "react";
import { Input } from "@/shared/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { DollarSign } from "lucide-react";

interface CampaignFundingTargetSectionProps {
  readOnly?: boolean;
  fundingGoal?: string;
  recipientAddress?: string;
  headerAction?: ReactNode;
  headerStatus?: ReactNode;
}

export function CampaignFundingTargetSection({
  readOnly = false,
  fundingGoal,
  recipientAddress,
  headerAction,
  headerStatus,
}: CampaignFundingTargetSectionProps) {
  const { control } = useFormContext();

  if (readOnly) {
    return (
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-2xl">Funding Target</h2>
          {(headerAction || headerStatus) && (
            <div className="flex items-center gap-3">
              {headerStatus}
              {headerAction}
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Funding goal and recipient address are immutable once the campaign is
          live.
        </p>
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/20 p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Funding goal
            </p>
            <p className="text-lg font-semibold text-foreground">
              {fundingGoal ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Recipient address
            </p>
            <p className="break-all text-sm font-medium text-foreground">
              {recipientAddress ?? "—"}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-bold text-2xl">
          Funding Target <span className="font-normal text-red-300">*</span>
        </h2>
        {(headerAction || headerStatus) && (
          <div className="flex items-center gap-3">
            {headerStatus}
            {headerAction}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-8">
        <FormField
          control={control}
          name="targetAmount"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-4">
              <FormLabel className="font-medium text-base">
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
            <FormItem className="flex flex-col gap-4">
              <FormLabel className="font-medium text-base">
                Add a funding Sui address
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="0x8894E0a0c962CB723c1976a4421c95949bE2D4E3"
                  {...field}
                />
              </FormControl>
              <p className="font-normal text-xs text-[#8f9197]">
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
