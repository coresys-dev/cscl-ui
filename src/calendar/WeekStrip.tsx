import { cn } from "../lib/cn";
import { weekdayNames } from "../lib/calendar";

export interface WeekStripProps {
  /** The 7 local ISO dates shown, Monday first (see `weekDays`). */
  days: string[];
  /** Local ISO date of today, highlighted. */
  today: string;
  /** How busy each day is; up to three dots are drawn. */
  counts?: number[];
  onSelect?: (iso: string) => void;
  locale?: string;
  className?: string;
}

const dots = (n: number) => (n <= 0 ? 0 : n <= 2 ? 1 : n <= 5 ? 2 : 3);

/** One week at a glance: weekday, date and up to three dots of load per day. */
export function WeekStrip({ days, today, counts = [], onSelect, locale, className }: WeekStripProps) {
  const names = weekdayNames(locale, true, "short");
  return (
    <div className={cn("grid min-h-0 gap-1.5", className)} style={{ gridTemplateColumns: "repeat(7, minmax(2.25rem, 1fr))" }}>
      {days.map((d, i) => (
        <button
          key={d}
          type="button"
          onClick={() => onSelect?.(d)}
          aria-current={d === today ? "date" : undefined}
          className={cn(
            "flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg py-1.5 transition-colors hover:bg-surface-hover",
            d === today && "bg-accent-muted",
          )}
        >
          <span className="text-[11px] capitalize text-text-muted">{names[i]}</span>
          <span className={cn("text-base font-medium tabular-nums", d === today ? "text-text" : "text-text-muted")}>{Number(d.slice(8))}</span>
          <span className="flex h-2 gap-0.5" aria-label={String(counts[i] ?? 0)}>
            {Array.from({ length: dots(counts[i] ?? 0) }, (_, k) => (
              <span key={k} className="h-1.5 w-1.5 rounded-full bg-accent" />
            ))}
          </span>
        </button>
      ))}
    </div>
  );
}
