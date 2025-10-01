import { Card, CardContent } from "@/shared/components/ui/card";

export interface StorageCost {
  label: string;
  amount: string;
}

interface CampaignStorageRegistrationCardProps {
  costs: StorageCost[];
  totalCost: string;
}

export function CampaignStorageRegistrationCard({
  costs,
  totalCost,
}: CampaignStorageRegistrationCardProps) {
  return (
    <section className="mb-12">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Storage registration</h2>
        <p className="text-muted-foreground">
          Review your storage costs, which are based on the files and content
          occupying space.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {costs.map((cost, index) => (
              <div
                key={index}
                className="flex justify-between py-3 border-b border-border"
              >
                <span className="font-medium">{cost.label}</span>
                <span className="font-mono">{cost.amount}</span>
              </div>
            ))}
            <div className="flex justify-between pt-4">
              <span className="text-lg font-semibold">Total storage cost</span>
              <span className="text-lg font-bold font-mono">{totalCost}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
