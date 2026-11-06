import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";
import { useOverlayStack } from "./Modal";

export interface PopoverProps {
  open: boolean;
  onClose: () => void;
  /** The trigger the panel hangs from. A click on it is left to it (it toggles `open`). */
  anchorRef: RefObject<HTMLElement | null>;
  /** Which edge of the anchor the panel lines up with. */
  align?: "start" | "end";
  ariaLabel: string;
  className?: string;
  children: ReactNode;
}

const GAP = 8;
const EDGE = 8;

/** Floating panel under an anchor (a bell, a search field, a swatch). Portaled
 * and `position: fixed` from the anchor's measured rect, so a transformed or
 * clipping ancestor can't trap it; flips above the anchor when there's no room
 * below and stays inside the viewport. Closes on Escape (top-most overlay
 * only), an outside click, scroll or resize. */
export function Popover({ open, onClose, anchorRef, align = "start", ariaLabel, className, children }: PopoverProps) {
  if (!open) return null;
  return (
    <PopoverPanel onClose={onClose} anchorRef={anchorRef} align={align} ariaLabel={ariaLabel} className={className}>
      {children}
    </PopoverPanel>
  );
}

function PopoverPanel({ onClose, anchorRef, align, ariaLabel, className, children }: Omit<PopoverProps, "open">) {
  useOverlayStack(onClose);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const place = () => {
      const el = ref.current;
      const anchor = anchorRef.current;
      if (!el || !anchor) return false;
      const r = anchor.getBoundingClientRect();
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const below = r.bottom + GAP + h <= window.innerHeight - EDGE;
      const left = align === "end" ? r.right - w : r.left;
      setPos({
        left: Math.max(EDGE, Math.min(left, window.innerWidth - w - EDGE)),
        top: below ? r.bottom + GAP : Math.max(EDGE, r.top - h - GAP),
      });
      return true;
    };
    // Mounted open in the same render as its anchor, the anchor's ref may not be set yet.
    if (place()) return;
    const frame = requestAnimationFrame(place);
    return () => cancelAnimationFrame(frame);
  }, [anchorRef, align]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (ref.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onClose();
    }
    // A scroll inside the panel itself (a long list) must not close it.
    function onScroll(e: Event) {
      if (!ref.current?.contains(e.target as Node)) onClose();
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onClose);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [onClose, anchorRef]);

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label={ariaLabel}
      style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? "visible" : "hidden" }}
      className={cn("animate-modal-in fixed z-[60] max-w-[calc(100vw-16px)] rounded-lg border border-border bg-surface p-3 shadow-float", className)}
    >
      {children}
    </div>,
    document.body,
  );
}
