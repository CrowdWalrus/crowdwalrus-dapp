import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  useNetworkVariable,
  type StorageDurationOption,
} from "@/shared/config/networkConfig";
import {
  InsufficientBalanceAlert,
  CertificationErrorAlert,
  StorageRegistrationSuccessAlert,
} from "@/features/campaigns/components/CampaignAlerts";

export interface StorageCost {
  label: string;
  amount: string;
}

interface CampaignStorageRegistrationCardProps {
  costs: StorageCost[];
  totalCost: string;
  isCalculating?: boolean;
  onRegister?: () => void;
  isPreparing?: boolean;
  walBalance?: string;
  hasInsufficientBalance?: boolean;
  requiredWalAmount?: number; // Required WAL amount for registration
  selectedEpochs?: number; // Currently selected number of epochs
  onEpochsChange?: (epochs: number) => void; // Callback when epochs selection changes
  certifyErrorMessage?: string | null;
  onRetryCertify?: () => void;
  isRetryingCertify?: boolean;
  isLocked?: boolean;
  storageRegistered?: boolean;
}

export function CampaignStorageRegistrationCard({
  costs,
  totalCost,
  isCalculating = false,
  onRegister,
  isPreparing = false,
  walBalance = "0 WAL",
  hasInsufficientBalance = false,
  requiredWalAmount,
  selectedEpochs,
  onEpochsChange,
  certifyErrorMessage,
  onRetryCertify,
  isRetryingCertify,
  isLocked = false,
  storageRegistered = false,
}: CampaignStorageRegistrationCardProps) {
  // Get network-specific storage duration options
  const storageDurationOptions = useNetworkVariable(
    "storageDurationOptions",
  ) as StorageDurationOption[];
  const epochConfig = useNetworkVariable("epochConfig") as {
    epochDurationDays: number;
    defaultEpochs: number;
    maxEpochs: number;
  };

  // Use default epochs if not provided
  const currentEpochs = selectedEpochs ?? epochConfig.defaultEpochs;

  // Find the current option label
  const currentOption = storageDurationOptions.find(
    (opt: StorageDurationOption) => opt.epochs === currentEpochs,
  );
  const defaultValue = currentOption?.label ?? storageDurationOptions[0].label;

  const walRate = "1 WAL = ~$0.38 USD";

  return (
    <section className="flex flex-col gap-8 mb-12">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold">Storage registration</h2>
        <p className="text-base font-medium text-[#0c0f1c]">
          Review your storage costs, which are based on the files and content
          occupying space.
        </p>
      </div>

      <Card className="bg-[#fbfbfb] border-black-50">
        <CardContent className="p-6 flex flex-col gap-8">
          {/* Registration Period */}
          <div className="flex flex-col gap-4">
            <label className="text-base font-medium text-[#0c0f1c]">
              Registration period
            </label>
            <Select
              value={defaultValue}
              disabled={isLocked}
              onValueChange={(value) => {
                if (isLocked) {
                  return;
                }
                const option = storageDurationOptions.find(
                  (opt: StorageDurationOption) => opt.label === value,
                );
                if (option && onEpochsChange) {
                  onEpochsChange(option.epochs);
                }
              }}
            >
              <SelectTrigger
                className="bg-white border-black-50"
                disabled={isLocked}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {storageDurationOptions.map((option: StorageDurationOption) => (
                  <SelectItem key={option.label} value={option.label}>
                    {option.label} ({option.epochs} epochs)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {currentEpochs} epoch{currentEpochs !== 1 ? "s" : ""} ×{" "}
              {epochConfig.epochDurationDays} day
              {epochConfig.epochDurationDays !== 1 ? "s" : ""} ={" "}
              {currentEpochs * epochConfig.epochDurationDays} days total
            </p>
          </div>

          {/* Storage Fees Card */}
          <Card className="bg-white border-black-50">
            <CardContent className="p-4 flex flex-col gap-4">
              {costs.map((cost, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm text-[#3d3f49]"
                >
                  <span className="font-normal">{cost.label}</span>
                  <span className="font-medium">{cost.amount}</span>
                </div>
              ))}
              <div className="h-px bg-[#e7e7e8]" />
              <div className="flex items-center justify-between pt-1 rounded-lg">
                <span className="text-sm font-semibold text-[#0c0f1c]">
                  Total Due
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-[#3d3f49]">
                    {totalCost}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Type */}
          <div className="flex flex-col gap-1">
            <div className="flex flex-col gap-4">
              <label className="text-base font-medium text-[#0c0f1c]">
                Payment type
              </label>
              <div className="bg-white border border-black-50 rounded-lg px-4 py-2.5 flex items-center justify-between min-h-[40px]">
                <div className="flex items-center gap-3">
                  <div className="size-5 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    <img
                      src="/assets/images/brand/walrus-logo.png"
                      alt="WAL"
                      className="size-full"
                    />
                  </div>
                  <span className="text-sm font-normal text-neutral-950">
                    WAL
                  </span>
                </div>
                <span className="text-sm font-normal text-neutral-500">
                  {walRate}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-1 text-xs text-[#3d3f49]">
              <span className="font-normal">Balance:</span>
              <span className="font-semibold">{walBalance}</span>
            </div>
          </div>

          {/* Error Alerts */}
          {storageRegistered && <StorageRegistrationSuccessAlert />}

          {!storageRegistered && hasInsufficientBalance && (
            <InsufficientBalanceAlert requiredWalAmount={requiredWalAmount} />
          )}

          {!storageRegistered && certifyErrorMessage && (
            <CertificationErrorAlert
              errorMessage={certifyErrorMessage}
              onRetry={onRetryCertify}
              isRetrying={isRetryingCertify}
            />
          )}

          {/* Register Button */}
          {!storageRegistered && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="bg-white border-black-50 min-h-[40px] px-6"
                onClick={onRegister}
                disabled={
                  isLocked ||
                  hasInsufficientBalance ||
                  isCalculating ||
                  isPreparing ||
                  !onRegister
                }
              >
                {isCalculating
                  ? "Calculating..."
                  : isPreparing
                    ? "Preparing..."
                    : "Register Storage"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
