import { Input } from "@/shared/components/ui/input";

interface CampaignTimelineProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export function CampaignTimeline({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: CampaignTimelineProps) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold mb-8">Campaign Timeline <span className="text-red-300">*</span></h2>
      <p className="text-muted-foreground mb-6">
        Set a timeline for your campaign to start and end
      </p>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            type="date"
            placeholder="Start date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Input
            type="date"
            placeholder="End date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}
