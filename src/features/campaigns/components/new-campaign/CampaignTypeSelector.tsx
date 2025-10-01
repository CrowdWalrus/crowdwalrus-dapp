import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";

interface CampaignTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CampaignTypeSelector({
  value,
  onChange,
}: CampaignTypeSelectorProps) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold mb-8">Campaign Type *</h2>

      <RadioGroup value={value} onValueChange={onChange} className="flex gap-6">
        <div className="flex items-start space-x-3 flex-1">
          <RadioGroupItem value="flexible" id="flexible" className="mt-1" />
          <div className="space-y-1">
            <Label htmlFor="flexible" className="font-medium cursor-pointer">
              Flexible
            </Label>
            <p className="text-sm text-muted-foreground">
              You will receive all funds raised, even if you don't reach your
              goal
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3 flex-1">
          <RadioGroupItem value="fixed" id="fixed" className="mt-1" />
          <div className="space-y-1">
            <Label htmlFor="fixed" className="font-medium cursor-pointer">
              Fixed (All-or-Nothing)
            </Label>
            <p className="text-sm text-muted-foreground">
              You only receive funds if you reach your goal by the deadline
            </p>
          </div>
        </div>
      </RadioGroup>
    </section>
  );
}
