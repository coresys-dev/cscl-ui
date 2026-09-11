import { Trash2, X } from "lucide-react";
import { Button } from "../primitives/Button";
import { IconButton } from "../primitives/IconButton";
import { cn } from "../lib/cn";

/** `"idle"`: nothing running, an optional "Run" button is offered.
 * `"running"`: a job is in flight — `processed`/`total` (when `total` is a
 * positive number) render a progress bar with a "processed/total" caption;
 * omit `total` (or pass `0`) for a job whose progress isn't measurable, in
 * which case only `runningLabel` text is shown. */
export type JobRowState =
  | { kind: "idle" }
  | { kind: "running"; runningLabel?: string; processed?: number; total?: number };

interface JobRowProps {
  title: string;
  description?: string;
  state: JobRowState;
  /** Shown on the idle-state "Run" button. Required together with `onRun`. */
  runLabel?: string;
  onRun?: () => void;
  runDisabled?: boolean;
  /** aria-label/title for the cancel icon button — required whenever
   * `onCancel` is passed. */
  cancelLabel?: string;
  onCancel?: () => void;
  /** Icon-only "delete this job's stored data" action (e.g. clear a cache) —
   * omit entirely for jobs with no data of their own to wipe. */
  deleteDataLabel?: string;
  onDeleteData?: () => void;
  deleteDataDisabled?: boolean;
  className?: string;
}

/** One row of the "list of background jobs" pattern shared by a floating
 * popover (`JobsPopover`) and a plain settings-page list — same row shape
 * works in both, so no separate wrapper is needed for the list case. Title +
 * optional description on the left; on the right, either an idle "Run"
 * button or a running-state cancel button, plus an optional delete-data
 * action. Progress bar only appears when the job reports a measurable total. */
export function JobRow({
  title,
  description,
  state,
  runLabel,
  onRun,
  runDisabled,
  cancelLabel,
  onCancel,
  deleteDataLabel,
  onDeleteData,
  deleteDataDisabled,
  className,
}: JobRowProps) {
  const running = state.kind === "running";
  const hasBar = running && typeof state.total === "number" && state.total > 0;
  const ratio = hasBar ? (state as { processed?: number; total?: number }).processed! / state.total! : 0;

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className={cn("truncate text-text", description ? "" : "text-xs")}>{title}</p>
          {description && <p className="text-xs text-text-muted">{description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {running ? (
            <>
              {state.runningLabel && <span className="text-xs text-text-muted">{state.runningLabel}</span>}
              {onCancel && (
                <IconButton onClick={onCancel} aria-label={cancelLabel ?? "Cancel"} title={cancelLabel} variant="danger" size="sm">
                  <X className="h-3 w-3" />
                </IconButton>
              )}
            </>
          ) : (
            onRun &&
            runLabel && (
              <Button variant="secondary" size="sm" onClick={onRun} disabled={runDisabled}>
                {runLabel}
              </Button>
            )
          )}
          {onDeleteData && (
            <IconButton
              onClick={onDeleteData}
              disabled={deleteDataDisabled}
              aria-label={deleteDataLabel ?? "Delete data"}
              title={deleteDataLabel}
              variant="danger"
              size="sm"
            >
              <Trash2 className="h-3 w-3" />
            </IconButton>
          )}
        </div>
      </div>
      {hasBar && (
        <>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface-hover">
            <div className="h-full bg-accent transition-all" style={{ width: `${Math.max(ratio * 100, 4)}%` }} />
          </div>
          {state.kind === "running" && state.total! > 0 && (
            <p className="mt-0.5 text-[11px] text-text-muted">
              {state.processed ?? 0}/{state.total}
            </p>
          )}
        </>
      )}
    </div>
  );
}
