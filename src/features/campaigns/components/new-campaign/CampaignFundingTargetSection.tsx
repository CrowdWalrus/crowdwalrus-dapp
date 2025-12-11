import {
  MAX_FUNDING_TARGET,
  MIN_FUNDING_TARGET,
  FUNDING_TARGET_DISPLAY_LOCALE,
} from "@/features/campaigns/constants/funding";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { DollarSign } from "lucide-react";
import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";

const numberFormatter = new Intl.NumberFormat(FUNDING_TARGET_DISPLAY_LOCALE);

const formatTargetAmountDisplay = (value?: string) => {
  if (!value) {
    return "";
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < MIN_FUNDING_TARGET) {
    return "";
  }

  return numberFormatter.format(numericValue);
};

const normalizeTargetAmountInput = (rawValue: string) => {
  const digitsOnly = rawValue.replace(/\D/g, "");
  if (digitsOnly.length === 0) {
    return "";
  }

  const withoutLeadingZeros = digitsOnly.replace(/^0+/, "");
  if (withoutLeadingZeros.length === 0) {
    return "";
  }

  const numericValue = Math.min(
    Number(withoutLeadingZeros),
    MAX_FUNDING_TARGET,
  );

  return String(numericValue);
};

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
    const formattedFundingGoal =
      fundingGoal && formatTargetAmountDisplay(fundingGoal);

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
              {formattedFundingGoal || fundingGoal || "—"}
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
            <FormItem
              className="flex flex-col gap-4"
              data-field-error="targetAmount"
            >
              <FormLabel className="font-medium text-base">
                Enter your campaign's goal amount
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#737373]" />
                  <Input
                    ref={field.ref}
                    name={field.name}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    type="text"
                    placeholder="Enter amount"
                    className="pl-12"
                    value={formatTargetAmountDisplay(field.value)}
                    onChange={(event) => {
                      const normalizedValue = normalizeTargetAmountInput(
                        event.target.value,
                      );
                      field.onChange(normalizedValue);
                    }}
                    onBlur={field.onBlur}
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
            <FormItem
              className="flex flex-col gap-4"
              data-field-error="walletAddress"
            >
              <FormLabel className="font-medium text-base">
                Add a funding Sui address
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="0x8894E0a0c962CB723c1976a4421c95949bE2D4E3"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(event) => {
                    const sanitizedValue = event.target.value.replace(
                      /\s+/g,
                      "",
                    );
                    field.onChange(sanitizedValue);
                  }}
                />
              </FormControl>
              <p className="font-normal text-xs text-black-200">
                This is the address that will receive all the payments.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </section>
  );
}
