import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { AlertCircle } from "lucide-react";

export interface StorageCost {
  label: string;
  amount: string;
}

interface CampaignStorageRegistrationCardProps {
  costs: StorageCost[];
  totalCost: string;
  onCalculate?: () => void;
  isCalculating?: boolean;
  walBalance?: string;
  hasInsufficientBalance?: boolean;
}

export function CampaignStorageRegistrationCard({
  costs,
  totalCost,
  onCalculate,
  isCalculating = false,
  walBalance = "0 WAL",
  hasInsufficientBalance = false,
}: CampaignStorageRegistrationCardProps) {
  // Mock data - replace with actual data from your state/props
  const registrationPeriod = "1 year (10 USD)";
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
            <Select defaultValue="1year">
              <SelectTrigger className="bg-white border-black-50">
                <SelectValue placeholder={registrationPeriod} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1year">1 year (10 USD)</SelectItem>
                <SelectItem value="2years">2 years (20 USD)</SelectItem>
                <SelectItem value="5years">5 years (50 USD)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Calculate Cost Button */}
          {onCalculate && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="bg-white border-black-50"
                onClick={onCalculate}
                disabled={isCalculating}
              >
                {isCalculating ? "Calculating..." : "Calculate Storage Cost"}
              </Button>
            </div>
          )}

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

          {/* Error Alert */}
          {hasInsufficientBalance && (
            <Alert className="bg-red-50 border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-4 text-red-600 mt-0.5" />
                <div className="flex-1 flex flex-col gap-0">
                  <AlertDescription className="text-sm font-medium text-red-600 leading-[1.5]">
                    Insufficient balance to complete registration
                  </AlertDescription>
                  <AlertDescription className="text-sm font-medium text-red-900 leading-[1.5]">
                    You need 111,098 WAL tokens to complete registration.
                  </AlertDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white border-black-50 shrink-0 h-9 px-4"
                >
                  Get $WAL
                </Button>
              </div>
            </Alert>
          )}

          {/* Register Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="bg-white border-black-50 min-h-[40px] px-6"
              disabled={hasInsufficientBalance}
            >
              Register Storage
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
