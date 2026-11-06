import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { Chip } from "./Chip";

export type SegmentedOption<T extends string> = { value: T; label: ReactNode };

export interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

/** One choice among a few, as a row of `Chip`s in a bordered tray. */
export function SegmentedControl<T extends string>({ value, options, onChange, ariaLabel, disabled, className }: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      className={cn("flex w-fit gap-1 rounded-md border border-border bg-surface-raised p-1", disabled && "opacity-50", className)}
    >
      {options.map((o) => (
        <Chip key={o.value} active={value === o.value} disabled={disabled} onClick={() => onChange(o.value)}>
          {o.label}
        </Chip>
      ))}
    </div>
  );
}
