import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";

interface CampaignTermsAndConditionsSectionProps {
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
}

export function CampaignTermsAndConditionsSection({
  accepted,
  onAcceptedChange,
}: CampaignTermsAndConditionsSectionProps) {
  return (
    <section className="mb-12">
      <h3 className="text-lg font-medium mb-6">Terms and conditions</h3>

      <div className="space-y-4">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="terms"
            className="mt-1"
            checked={accepted}
            onCheckedChange={(checked) =>
              onAcceptedChange(checked as boolean)
            }
          />
          <Label htmlFor="terms" className="cursor-pointer font-normal">
            By publishing campaign at CrowdWalrus you agree to our Terms and
            Conditions.
          </Label>
        </div>

        <Alert>
          <AlertDescription>
            Please review your campaign details carefully before registration.
            Once registered, some details cannot be changed without additional
            transactions.
          </AlertDescription>
        </Alert>
      </div>
    </section>
  );
}
