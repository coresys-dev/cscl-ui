import { cn } from "../lib/cn";

/** Thin determinate bar, `value` in 0..1. */
export function ProgressBar({
  value,
  className,
  tone = "accent",
  smooth,
}: {
  value: number;
  className?: string;
  tone?: "accent" | "attention" | "danger";
  smooth?: boolean;
}) {
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  const fill = tone === "danger" ? "bg-danger" : tone === "attention" ? "bg-accent-2" : "bg-accent";
  return (
    <div
      className={cn("h-1 w-full overflow-hidden rounded-full bg-surface-hover", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
    >
      <div className={cn("h-full", smooth ? "transition-[width] duration-700 ease-in-out-quart" : "transition-all", fill)} style={{ width: `${pct}%` }} />
    </div>
  );
}
