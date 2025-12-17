import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface InsufficientBalanceAlertProps {
  requiredWalAmount?: number;
}

export function InsufficientBalanceAlert({
  requiredWalAmount,
}: InsufficientBalanceAlertProps) {
  return (
    <Alert className="bg-red-50 border-red-200">
      <div className="flex items-start gap-3">
        <AlertCircle className="size-4 text-red-600 mt-0.5" />
        <div className="flex-1 flex flex-col gap-0">
          <AlertDescription className="text-sm font-medium text-red-600 leading-[1.5]">
            Insufficient balance to complete registration
          </AlertDescription>
          <AlertDescription className="text-sm font-medium text-red-900 leading-[1.5]">
            {requiredWalAmount
              ? `You need ${requiredWalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })} WAL tokens to complete registration.`
              : "You need more WAL tokens to complete registration."}
          </AlertDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="bg-white border-black-50 shrink-0 h-9 px-4"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open('https://trade.bluefin.io/swap/SUI-WAL', '_blank');
          }}
        >
          Get $WAL
        </Button>
      </div>
    </Alert>
  );
}

interface CertificationErrorAlertProps {
  errorMessage: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function CertificationErrorAlert({
  errorMessage,
  onRetry,
  isRetrying = false,
}: CertificationErrorAlertProps) {
  return (
    <Alert className="bg-red-50 border-red-200">
      <div className="flex items-start gap-3">
        <AlertCircle className="size-4 text-red-600 mt-0.5" />
        <div className="flex-1 flex flex-col gap-0">
          <AlertDescription className="text-sm font-medium text-red-600 leading-[1.5]">
            Certification was cancelled in your wallet
          </AlertDescription>
          <AlertDescription className="text-sm font-medium text-red-900 leading-[1.5]">
            {errorMessage}
          </AlertDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="bg-white border-black-50 shrink-0 h-9 px-4"
          onClick={onRetry}
          disabled={isRetrying || !onRetry}
        >
          {isRetrying ? "Retrying..." : "Try again"}
        </Button>
      </div>
    </Alert>
  );
}

interface StorageRegistrationSuccessAlertProps {
  title?: string;
  description?: string;
}

export function StorageRegistrationSuccessAlert({
  title = "Storage registration completed successfully!",
  description = "You can now proceed to publish your campaign.",
}: StorageRegistrationSuccessAlertProps) {
  return (
    <Alert className="bg-sgreen-50 border-sgreen-200">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="size-4 text-sgreen-700 mt-0.5" />
        <div className="flex-1 flex flex-col gap-0">
          <AlertDescription className="text-sm font-medium text-sgreen-700 leading-[1.5]">
            {title}
          </AlertDescription>
          <AlertDescription className="text-sm font-medium text-sgreen-900 leading-[1.5]">
            {description}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
