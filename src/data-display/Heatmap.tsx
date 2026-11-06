import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { heatLevel } from "../lib/heat";

const LEVEL = ["bg-surface-hover", "bg-accent/25", "bg-accent/45", "bg-accent/70", "bg-accent"] as const;

export interface HeatmapProps {
  /** Rows of values; `null` draws an empty slot (a day still to come). */
  values: (number | null)[][];
  /** Labels down the left side, one per row (weekdays). */
  rowLabels?: ReactNode[];
  /** Labels along the top, one per column; leave some empty to thin them out. */
  colLabels?: ReactNode[];
  /** Hover text of a cell (already formatted: "3 sessions on 4 Nov"). */
  cellTitle?: (row: number, col: number, value: number) => string;
  /** Scale reference; defaults to the largest value. */
  max?: number;
  /** Stretch the cells to fill the container's height (a dashboard card) instead of keeping them square. */
  fill?: boolean;
  className?: string;
}

/** A grid of cells shaded in five steps of the accent: a contribution calendar
 * (7 rows by weeks, see `calendarHeatmap`) or a weekday × hour map. Cells keep
 * a square-ish minimum and stretch to fill the width. Pair it with a sentence
 * that states the peak: shade alone never carries the number. */
export function Heatmap({ values, rowLabels, colLabels, cellTitle, max, fill, className }: HeatmapProps) {
  const cols = Math.max(0, ...values.map((r) => r.length));
  const top = max ?? Math.max(0, ...values.flat().map((v) => v ?? 0));
  const template = `${rowLabels ? "2rem " : ""}repeat(${cols}, minmax(9px, 1fr))`;
  return (
    <div className={cn("overflow-x-auto", fill && "h-full", className)}>
      <div
        className={cn("grid gap-[3px]", fill && "h-full")}
        style={{
          gridTemplateColumns: template,
          gridTemplateRows: fill ? `${colLabels ? "auto " : ""}repeat(${values.length}, minmax(9px, 1fr))` : undefined,
          minWidth: cols * 12,
        }}
      >
        {colLabels && (
          <>
            {rowLabels && <span />}
            {Array.from({ length: cols }, (_, c) => (
              <span key={`h${c}`} className="text-center text-[10px] tabular-nums text-text-muted">
                {colLabels[c]}
              </span>
            ))}
          </>
        )}
        {values.map((row, r) => (
          <div key={r} className="contents">
            {rowLabels && <span className="self-center text-[10px] uppercase tracking-wide text-text-muted">{rowLabels[r]}</span>}
            {Array.from({ length: cols }, (_, c) => {
              const v = row[c];
              if (v === null || v === undefined) return <span key={c} />;
              return (
                <span key={c} title={cellTitle?.(r, c, v)} className={cn("min-h-[9px] rounded-[2px]", !fill && "aspect-square", LEVEL[heatLevel(v, top)])} />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
