import { useState, type ReactNode } from "react";
import { cn } from "../lib/cn";

/** Minimal shape a background job needs to expose for aggregate progress
 * display — swap in whatever richer job type the app has, it just needs to
 * project down to this. */
export interface ProgressJob {
  id: string | number;
  label: string;
  processed: number;
  total: number;
}

interface ProgressIndicatorProps {
  jobs: ProgressJob[];
  /** Text under the bar, e.g. "3 tasks running" — computed by the caller so
   * this component stays free of pluralization/i18n concerns. */
  summaryLabel: string;
  /** Rendered in an absolutely-positioned panel above the bar when expanded
   * (typically a `JobsPopover`). Receives nothing — close over `jobs` and
   * an `onClose` in the caller. */
  renderPopover: (close: () => void) => ReactNode;
  className?: string;
}

/** Sidebar-style aggregate progress bar: sums `processed`/`total` across every
 * active job into one bar, hidden entirely when `jobs` is empty. Click toggles
 * an expandable popover (rendered via `renderPopover`) listing the individual
 * jobs. Bar never drops below a 4% sliver so it stays visible even when a job
 * has just started and reported almost no progress yet. */
export function ProgressIndicator({ jobs, summaryLabel, renderPopover, className }: ProgressIndicatorProps) {
  const [open, setOpen] = useState(false);

  if (jobs.length === 0) return null;

  const totals = jobs.reduce(
    (acc, job) => ({ processed: acc.processed + job.processed, total: acc.total + job.total }),
    { processed: 0, total: 0 },
  );
  const ratio = totals.total > 0 ? totals.processed / totals.total : 0;

  return (
    <div className={cn("relative", className)}>
      <button type="button" onClick={() => setOpen((prev) => !prev)} className="block w-full text-left">
        <div className="h-1 w-full overflow-hidden rounded-full bg-surface-hover">
          <div className="h-full bg-accent transition-all" style={{ width: `${Math.max(ratio * 100, 4)}%` }} />
        </div>
        <p className="mt-1 truncate text-xs text-text-muted transition-colors hover:text-text">{summaryLabel}</p>
      </button>
      {open && renderPopover(() => setOpen(false))}
    </div>
  );
}
