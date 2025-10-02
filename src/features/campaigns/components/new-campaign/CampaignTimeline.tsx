import { useState } from "react";
import { Calendar } from "lucide-react";
import { Calendar as CalendarComponent } from "@/shared/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/utils";

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
  const [startDateObj, setStartDateObj] = useState<Date | undefined>(
    startDate ? new Date(startDate) : undefined
  );
  const [endDateObj, setEndDateObj] = useState<Date | undefined>(
    endDate ? new Date(endDate) : undefined
  );

  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDateObj(date);
    onStartDateChange(date ? date.toISOString().split("T")[0] : "");
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDateObj(date);
    onEndDateChange(date ? date.toISOString().split("T")[0] : "");
  };

  return (
    <section className="flex flex-col gap-8">
      <h2 className="text-2xl font-bold leading-[1.6] text-[#0c0f1c]">
        Campaign Timeline <span className="text-[#f5827a]">*</span>
      </h2>
      <div className="flex flex-col gap-4">
        <p className="text-base font-medium leading-[1.6] text-[#0c0f1c]">
          Set a timeline for your campaign to start and end
        </p>
        <div className="flex gap-6 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1.5 border border-neutral-200 rounded-lg bg-white w-[197px] min-h-[32px]",
                  !startDateObj && "text-neutral-500"
                )}
              >
                <Calendar className="size-5 text-[#737373]" />
                <span className="text-sm font-normal leading-[1.5] tracking-[0.07px]">
                  {startDateObj
                    ? startDateObj.toLocaleDateString()
                    : "Pick a start date"}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <CalendarComponent
                mode="single"
                selected={startDateObj}
                onSelect={handleStartDateSelect}
                disabled={(date) =>
                  endDateObj ? date > endDateObj : false
                }
                initialFocus
                className="scale-110"
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1.5 border border-neutral-200 rounded-lg bg-white w-[197px] min-h-[32px]",
                  !endDateObj && "text-neutral-500"
                )}
              >
                <Calendar className="size-5 text-[#737373]" />
                <span className="text-sm font-normal leading-[1.5] tracking-[0.07px]">
                  {endDateObj
                    ? endDateObj.toLocaleDateString()
                    : "Pick a end date"}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <CalendarComponent
                mode="single"
                selected={endDateObj}
                onSelect={handleEndDateSelect}
                disabled={(date) =>
                  startDateObj ? date < startDateObj : false
                }
                initialFocus
                className="scale-110"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </section>
  );
}
