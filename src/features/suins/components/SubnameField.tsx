import { useEffect, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Loader2, Check, AlertCircleIcon, Info, Lock } from "lucide-react";

import { useDebounce } from "@/shared/hooks/useDebounce";
import { useSubnameAvailability } from "@/features/campaigns/hooks/useSubnameAvailability";
import { formatSubdomain, SUBDOMAIN_PATTERN } from "@/shared/utils/subdomain";
import { cn } from "@/shared/lib/utils";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/shared/components/ui/form";

interface SubnameFieldProps {
  name?: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  locked?: boolean;
  lockedMessage?: string;
}

export function SubnameField({
  name = "subdomain",
  label,
  placeholder = "your-name",
  required = false,
  disabled = false,
  locked = false,
  lockedMessage = "This nickname is locked and can't be changed.",
}: SubnameFieldProps) {
  const form = useFormContext();
  const subdomainValue = useWatch({ control: form.control, name });

  const inputId = `${name}-input`;

  const rawSubdomain = (subdomainValue ?? "").trim();
  const debouncedSubdomain = useDebounce(rawSubdomain, 400);
  const hasRawSubdomain = rawSubdomain.length > 0;
  const hasDebouncedSubdomain = debouncedSubdomain.length > 0;
  const isLocked = locked && hasRawSubdomain;
  const isSubdomainPatternValid =
    hasDebouncedSubdomain && SUBDOMAIN_PATTERN.test(debouncedSubdomain);
  const shouldCheckAvailability = !disabled && isSubdomainPatternValid;

  const {
    status: subnameStatus,
    fullName: resolvedSubdomainFull,
    campaignDomain,
    isChecking: isCheckingSubname,
    error: subnameError,
  } = useSubnameAvailability(
    shouldCheckAvailability ? debouncedSubdomain : null,
  );

  const availabilityErrorMessage = subnameError?.message ?? "";

  const debouncedFullSubdomain =
    campaignDomain && hasDebouncedSubdomain
      ? formatSubdomain(debouncedSubdomain, campaignDomain)
      : "";

  const availabilityFullSubdomain =
    resolvedSubdomainFull || debouncedFullSubdomain;

  const rawFullSubdomain =
    campaignDomain && hasRawSubdomain && SUBDOMAIN_PATTERN.test(rawSubdomain)
      ? formatSubdomain(rawSubdomain, campaignDomain)
      : "";

  const availabilityDisplayName =
    availabilityFullSubdomain ||
    debouncedFullSubdomain ||
    rawFullSubdomain ||
    rawSubdomain ||
    "this sub-name";

  const lockedFullSubdomain =
    campaignDomain && hasRawSubdomain && SUBDOMAIN_PATTERN.test(rawSubdomain)
      ? formatSubdomain(rawSubdomain, campaignDomain)
      : availabilityDisplayName;

  const includesCampaignSuffix =
    !!campaignDomain && rawSubdomain.endsWith(`.${campaignDomain}`);
  const containsDot = rawSubdomain.includes(".");

  const subdomainFieldState = form.getFieldState(name);
  const fieldErrorMessage =
    (subdomainFieldState.error?.message as string | undefined) ?? "";
  const isManualFieldError = subdomainFieldState.error?.type === "manual";

  useEffect(() => {
    if (isLocked) {
      if (isManualFieldError) {
        form.clearErrors(name);
      }
      return;
    }

    if (!isSubdomainPatternValid) {
      if (isManualFieldError) {
        form.clearErrors(name);
      }
      return;
    }

    if (subnameStatus === "checking") {
      if (isManualFieldError) {
        form.clearErrors(name);
      }
      return;
    }

    if (subnameStatus === "taken") {
      const message = "This sub-name has already been taken";
      if (fieldErrorMessage !== message) {
        form.setError(name, { type: "manual", message });
      }
      return;
    }

    if (subnameStatus === "error") {
      const message = `We couldn't verify this sub-name right now. Please try again${availabilityErrorMessage ? ` (${availabilityErrorMessage})` : ""}.`;
      if (fieldErrorMessage !== message) {
        form.setError(name, { type: "manual", message });
      }
      return;
    }

    if (isManualFieldError) {
      form.clearErrors(name);
    }
  }, [
    availabilityErrorMessage,
    form,
    fieldErrorMessage,
    isLocked,
    isManualFieldError,
    isSubdomainPatternValid,
    name,
    subnameStatus,
  ]);

  const helperVariant = useMemo(() => {
    if (isLocked) {
      return "success";
    }

    if (!campaignDomain || !hasRawSubdomain) {
      return "default";
    }

    if (
      includesCampaignSuffix ||
      (containsDot && !includesCampaignSuffix) ||
      subnameStatus === "taken" ||
      subnameStatus === "error"
    ) {
      return "error";
    }

    if (subnameStatus === "available") {
      return "success";
    }

    return "default";
  }, [
    campaignDomain,
    containsDot,
    hasRawSubdomain,
    includesCampaignSuffix,
    isLocked,
    subnameStatus,
  ]);

  const subdomainHelperClass = cn(
    "text-xs",
    helperVariant === "error"
      ? "text-red-500"
      : helperVariant === "success"
        ? "text-sgreen-700"
        : "text-black-200",
  );

  const subdomainHelperText = (() => {
    if (fieldErrorMessage) {
      return "";
    }

    if (isLocked) {
      return `Registered as ${lockedFullSubdomain}. ${lockedMessage}`;
    }

    if (disabled) {
      return "";
    }

    if (!campaignDomain) {
      return "Loading network configuration…";
    }

    if (includesCampaignSuffix) {
      return `You only need the part before .${campaignDomain}. We'll add it automatically.`;
    }

    if (containsDot && !includesCampaignSuffix) {
      return "Skip the domain suffix; just choose a unique label.";
    }

    if (subnameStatus === "available") {
      return "This sub-name is available to register";
    }

    if (subnameStatus === "taken") {
      return "This sub-name has already been taken";
    }

    if (subnameStatus === "error") {
      return `We couldn't verify availability for ${availabilityDisplayName}. Please try again${availabilityErrorMessage ? ` (${availabilityErrorMessage})` : ""}.`;
    }

    return "Enter your preferred sub-name to check its availability";
  })();

  const shouldShowHelperText = subdomainHelperText.length > 0;

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem
          className="flex flex-col gap-4"
          data-field-error={name}
        >
          <FormLabel className="font-medium text-base" htmlFor={inputId}>
            {label} {required && <span className="text-red-300">*</span>}
          </FormLabel>
          <div className="flex flex-col gap-2">
            <div
              className={cn(
                "flex h-10 w-full items-center gap-3 rounded-lg border bg-white-50 px-4 py-[9.5px]",
                subdomainFieldState.error ? "border-red-500" : "border-input",
              )}
            >
              {isCheckingSubname && shouldCheckAvailability && !isLocked && (
                <Loader2 className="size-[18px] animate-spin text-black-300" />
              )}
              {isLocked && (
                <Lock className="size-[18px] text-black-300" />
              )}
              <FormControl>
                <input
                  {...field}
                  id={inputId}
                  placeholder={placeholder}
                  disabled={disabled}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                />
              </FormControl>
              {campaignDomain && (
                <span className="whitespace-nowrap text-sm text-black-300">
                  .{campaignDomain}
                </span>
              )}
            </div>
            {shouldShowHelperText && (
              <div className="flex items-center gap-1">
                {isLocked ? (
                  <Check className="size-[18px] text-sgreen-700" />
                ) : subnameStatus === "available" ? (
                  <Check className="size-[18px] text-sgreen-700" />
                ) : subnameStatus === "taken" || subnameStatus === "error" ? (
                  <AlertCircleIcon className="size-[18px] text-red-500" />
                ) : (
                  <Info className="size-[18px] text-black-200" />
                )}
                <p className={subdomainHelperClass}>{subdomainHelperText}</p>
              </div>
            )}
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
}
