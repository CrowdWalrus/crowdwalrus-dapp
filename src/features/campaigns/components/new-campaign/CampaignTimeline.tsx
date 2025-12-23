import { useState, type ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { Calendar } from "lucide-react";
import { Calendar as CalendarComponent } from "@/shared/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { FormMessage } from "@/shared/components/ui/form";
import { cn } from "@/shared/lib/utils";

interface CampaignTimelineProps {
  readOnly?: boolean;
  startDateMs?: number;
  endDateMs?: number;
  headerAction?: ReactNode;
  headerStatus?: ReactNode;
}

function ReadOnlyCampaignTimeline({
  startDateMs,
  endDateMs,
  headerAction,
  headerStatus,
}: CampaignTimelineProps) {
  const startDateLabel = startDateMs
    ? new Date(startDateMs).toLocaleDateString()
    : "—";
  const endDateLabel = endDateMs
    ? new Date(endDateMs).toLocaleDateString()
    : "—";

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold leading-[1.6]">Funding Duration</h2>
        {(headerAction || headerStatus) && (
          <div className="flex items-center gap-3">
            {headerStatus}
            {headerAction}
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Funding duration cannot be edited after launch. These dates were set
        when the campaign was created.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Start date
          </p>
          <p className="text-lg font-semibold text-foreground">
            {startDateLabel}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            End date
          </p>
          <p className="text-lg font-semibold text-foreground">
            {endDateLabel}
          </p>
        </div>
      </div>
    </section>
  );
}

function EditableCampaignTimeline({
  headerAction,
  headerStatus,
}: CampaignTimelineProps) {
  const {
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useFormContext();
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const startDate = watch("startDate");
  const endDate = watch("endDate");

  const startDateObj = startDate ? new Date(startDate) : undefined;
  const endDateObj = endDate ? new Date(endDate) : undefined;
  // Set minimum date to tomorrow to give users time to prepare
  // and avoid confusion with same-day campaign starts
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const handleStartDateSelect = (date: Date | undefined) => {
    const formattedDate = date
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
      : "";
    setValue("startDate", formattedDate, {
      shouldValidate: true,
    });
    // Re-validate endDate to check the date range refinement
    if (endDate) {
      trigger("endDate");
    }
    if (date) {
      setStartDateOpen(false);
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    const formattedDate = date
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
      : "";
    setValue("endDate", formattedDate, {
      shouldValidate: true,
    });
    // Re-validate startDate to check the date range refinement
    if (startDate) {
      trigger("startDate");
    }
    if (date) {
      setEndDateOpen(false);
    }
  };

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold leading-[1.6]">
          Funding Duration <span className="text-red-300">*</span>
        </h2>
        {(headerAction || headerStatus) && (
          <div className="flex items-center gap-3">
            {headerStatus}
            {headerAction}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4">
        <p className="text-base font-medium">
          Choose when your campaign can receive payments— from start to end
          date. Before that, it’s Coming Soon; after that, funding closes
          automatically.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6 items-start">
          <div className="flex flex-col gap-2" data-field-error="startDate">
            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 border border-neutral-200 rounded-lg bg-white w-full sm:w-[197px] min-h-[32px]",
                    !startDateObj && "text-neutral-500",
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
              <PopoverContent className="w-auto" align="start">
                <CalendarComponent
                  mode="single"
                  selected={startDateObj}
                  onSelect={handleStartDateSelect}
                  disabled={(date) =>
                    date < tomorrow || (endDateObj ? date > endDateObj : false)
                  }
                  className="w-[250px] scale-110"
                />
              </PopoverContent>
            </Popover>
            {errors.startDate && (
              <FormMessage>{String(errors.startDate.message)}</FormMessage>
            )}
          </div>

          <div className="flex flex-col gap-2" data-field-error="endDate">
            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 border border-neutral-200 rounded-lg bg-white w-full sm:w-[197px] min-h-[32px]",
                    !endDateObj && "text-neutral-500",
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
              <PopoverContent align="center">
                <CalendarComponent
                  mode="single"
                  selected={endDateObj}
                  onSelect={handleEndDateSelect}
                  disabled={(date) =>
                    date < tomorrow || (startDateObj ? date < startDateObj : false)
                  }
                  className="w-[250px] scale-110"
                />
              </PopoverContent>
            </Popover>
            {errors.endDate && (
              <FormMessage>{String(errors.endDate.message)}</FormMessage>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function CampaignTimeline(props: CampaignTimelineProps) {
  if (props.readOnly) {
    return <ReadOnlyCampaignTimeline {...props} />;
  }

  return <EditableCampaignTimeline {...props} />;
}
