import type { MouseEvent, ReactNode } from "react";
import { cn } from "../lib/cn";

export interface ChipProps {
  active?: boolean;
  onClick?: () => void;
  onContextMenu?: (e: MouseEvent) => void;
  title?: string;
  /** The active state reads as a deliberately unsafe choice: fills `danger` instead of `accent`. */
  danger?: boolean;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

/** Small uppercase toggle: filters, format toggles, a segmented control's option. */
export function Chip({ active, onClick, onContextMenu, title, danger, disabled, children, className }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onContextMenu={onContextMenu}
      title={title}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium uppercase tracking-wide transition-all duration-150 active:scale-95 disabled:pointer-events-none disabled:opacity-40 [&_svg]:h-3.5 [&_svg]:w-3.5",
        active ? (danger ? "bg-danger-muted text-danger" : "bg-accent-muted text-accent") : "text-text-muted hover:bg-surface-hover hover:text-text",
        className,
      )}
    >
      <span className="optical-center-text">{children}</span>
    </button>
  );
}
