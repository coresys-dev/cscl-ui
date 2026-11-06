import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/cn";
import { monthGrid, weekdayNames } from "../lib/calendar";
import { IconButton } from "../primitives/IconButton";

export interface MonthGridLabels {
  previous: string;
  next: string;
}

export interface MonthGridProps {
  /** The month shown first; default: this month. */
  defaultMonth?: Date;
  weekStartsMonday?: boolean;
  /** BCP 47 locale for month and weekday names; default: the system's. */
  locale?: string;
  /** A dot under days that carry something (count > 0). Receives the local ISO date. */
  count?: (iso: string) => number;
  onSelectDay?: (iso: string) => void;
  /** Click on the month title (e.g. open the full calendar). */
  onTitleClick?: () => void;
  labels?: Partial<MonthGridLabels>;
  className?: string;
}

const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** A compact month: navigation, weekday initials, today filled with the accent, a dot on busy days. */
export function MonthGrid({ defaultMonth, weekStartsMonday = true, locale, count, onSelectDay, onTitleClick, labels, className }: MonthGridProps) {
  const l = { previous: "Previous month", next: "Next month", ...labels };
  const today = new Date();
  const start = defaultMonth ?? today;
  const [shift, setShift] = useState(0);
  const view = new Date(start.getFullYear(), start.getMonth() + shift, 1);
  const year = view.getFullYear();
  const month = view.getMonth();
  const grid = useMemo(() => monthGrid(year, month, weekStartsMonday), [year, month, weekStartsMonday]);
  const heads = weekdayNames(locale, weekStartsMonday, "narrow");
  const title = view.toLocaleDateString(locale, { month: "long", year: "numeric" });
  const thisMonth = year === today.getFullYear() && month === today.getMonth();
  const Title = onTitleClick ? "button" : "span";
  return (
    <div className={cn("flex min-h-0 flex-col gap-1 p-2", className)}>
      <div className="flex items-center justify-between">
        <IconButton aria-label={l.previous} onClick={() => setShift(shift - 1)}>
          <ChevronLeft />
        </IconButton>
        <Title
          {...(onTitleClick ? { type: "button" as const, onClick: onTitleClick } : {})}
          className={cn("text-sm font-medium capitalize text-text", onTitleClick && "hover:underline")}
        >
          {title}
        </Title>
        <IconButton aria-label={l.next} onClick={() => setShift(shift + 1)}>
          <ChevronRight />
        </IconButton>
      </div>
      <div
        className="grid min-h-0 flex-1 grid-cols-7 content-between text-center text-xs"
        style={{ gridTemplateRows: `auto repeat(${grid.length}, minmax(0, 1fr))` }}
      >
        {heads.map((d, i) => (
          <span key={i} className="capitalize text-text-muted">
            {d}
          </span>
        ))}
        {grid.flat().map((day, i) => {
          if (day === null) return <span key={i} />;
          const date = iso(year, month, day);
          const isToday = thisMonth && day === today.getDate();
          const busy = (count?.(date) ?? 0) > 0;
          const Cell = onSelectDay ? "button" : "span";
          return (
            <Cell
              key={i}
              {...(onSelectDay ? { type: "button" as const, onClick: () => onSelectDay(date) } : {})}
              aria-current={isToday ? "date" : undefined}
              className={cn("flex flex-col items-center justify-center rounded-md py-0.5", onSelectDay && "hover:bg-surface-hover")}
            >
              <span className={isToday ? "flex h-6 w-6 items-center justify-center rounded-full bg-accent font-medium text-bg" : "tabular-nums text-text"}>
                {day}
              </span>
              <span className={cn("h-1 w-1 rounded-full", busy && "bg-accent")} />
            </Cell>
          );
        })}
      </div>
    </div>
  );
}
