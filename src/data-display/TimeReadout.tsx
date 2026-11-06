import { formatClock } from "../lib/duration";
import { cn } from "../lib/cn";

export interface TimeReadoutProps {
  /** Elapsed or remaining seconds; the caller ticks it. */
  seconds: number;
  /** Small uppercase label above the digits ("Effective work", "Break"). */
  label?: string;
  size?: "lg" | "md" | "sm";
  /** `MM:SS` instead of `HH:MM:SS` (a pomodoro, a countdown under an hour). */
  short?: boolean;
  className?: string;
}

const SIZE = { lg: "text-5xl", md: "text-2xl", sm: "text-xl" } as const;

/** A chronometer readout: tabular digits so they don't jitter as they tick. */
export function TimeReadout({ seconds, label, size = "lg", short, className }: TimeReadoutProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {label && (
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
          <span className="optical-center-text">{label}</span>
        </span>
      )}
      <span className={cn("font-medium tabular-nums tracking-tight text-text", SIZE[size])} aria-live="off">
        {formatClock(seconds, short)}
      </span>
    </div>
  );
}
