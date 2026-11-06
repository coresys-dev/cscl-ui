import { cloneElement, useEffect, useId, useState, type ReactElement, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface TooltipProps {
  label: ReactNode;
  shortcut?: ReactNode;
  side?: "top" | "bottom";
  /** Delay before showing, in ms. */
  delay?: number;
  /** One focusable element: the trigger. */
  children: ReactElement<Record<string, unknown>>;
}

/** Names an icon-only control on hover or keyboard focus — ported from the
 * CoreSys DS web/app kit (`Tooltip`). Portaled and positioned from the
 * trigger's rect so a transformed or clipping ancestor can't trap it. */
export function Tooltip({ label, shortcut, side = "top", delay = 300, children }: TooltipProps) {
  const id = useId();
  const [rect, setRect] = useState<DOMRect | null>(null);
  // The hovered/focused trigger, waiting out `delay` before the tip opens.
  const [pending, setPending] = useState<Element | null>(null);

  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => setRect(pending.getBoundingClientRect()), delay);
    return () => window.clearTimeout(timer);
  }, [pending, delay]);

  function show(target: Element) {
    if (delay <= 0) setRect(target.getBoundingClientRect());
    else setPending(target);
  }

  function hide() {
    setPending(null);
    setRect(null);
  }

  const props = children.props;
  const trigger = cloneElement(children, {
    "aria-describedby": rect ? id : undefined,
    onMouseEnter: (e: { currentTarget: Element }) => show(e.currentTarget),
    onMouseLeave: hide,
    onFocus: (e: { currentTarget: Element }) => show(e.currentTarget),
    onBlur: hide,
    onKeyDown: (e: { key: string }) => {
      if (e.key === "Escape") hide();
      (props.onKeyDown as ((e: unknown) => void) | undefined)?.(e);
    },
  });

  return (
    <>
      {trigger}
      {rect &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            className="pointer-events-none fixed z-50 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-surface-raised px-2 py-1 text-xs text-text shadow-float"
            style={{
              left: rect.left + rect.width / 2,
              ...(side === "top" ? { top: rect.top - 6, transform: "translate(-50%, -100%)" } : { top: rect.bottom + 6 }),
            }}
          >
            {label}
            {shortcut && <span className="ml-2 text-text-muted">{shortcut}</span>}
          </div>,
          document.body,
        )}
    </>
  );
}
