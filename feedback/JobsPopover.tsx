import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "../lib/cn";

interface JobsPopoverProps {
  /** Accessible name for the popover, e.g. "3 tasks running". */
  ariaLabel: string;
  onClose: () => void;
  /** Typically a list of `JobRow`s, one per active job. */
  children: ReactNode;
  className?: string;
}

/** Floating chrome for the "list of active jobs" pattern: positions itself
 * above its anchor (bottom-left of a sidebar trigger by default via
 * `className`), closes on outside click or Escape. Renders whatever rows are
 * passed as `children` — typically `JobRow`s — so it carries no job-specific
 * logic itself. For a plain settings-page list of the same rows, render
 * `JobRow`s directly without this wrapper. */
export function JobsPopover({ ariaLabel, onClose, children, className }: JobsPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={ariaLabel}
      className={cn(
        "animate-modal-in absolute bottom-full left-3 right-3 z-20 mb-2 space-y-3 rounded-lg border border-border bg-surface p-3 shadow-float",
        className,
      )}
    >
      {children}
    </div>
  );
}
