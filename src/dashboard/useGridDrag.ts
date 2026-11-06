// Pointer drag on a widget grid, with no library: the pointer's offset from where it went down, in pixels and in
// grid cells. Only a change of cell is reported to `onMove`, so the layout is computed once per cell crossed.
import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { cellsFromDelta } from "../lib/grid";

export interface GridDragOptions {
  /** The size of one cell and the gap, read when the drag starts. */
  cell: () => { w: number; h: number; gap: number };
  /** The offset in cells, called each time it changes. */
  onMove: (dx: number, dy: number) => void;
  onEnd: () => void;
  /** Called first, when the pointer goes down. */
  onStart?: () => void;
  /** The offset in pixels, on every pointer frame (for the card to follow the pointer without a render). */
  onFrame?: (px: number, py: number) => void;
  /** Escape, or the system took the pointer away: the drag is called off. */
  onCancel?: () => void;
}

export function useGridDrag(opts: GridDragOptions): { onPointerDown: (e: ReactPointerEvent) => void } {
  const latest = useRef(opts);
  latest.current = opts;
  const stop = useRef<(() => void) | null>(null);
  // A drag still under way when the widget goes away is ended, never left listening.
  useEffect(() => () => stop.current?.(), []);

  const onPointerDown = useCallback((e: ReactPointerEvent) => {
    if (e.button !== 0 || stop.current) return;
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    const pointer = e.pointerId;
    const x0 = e.clientX;
    const y0 = e.clientY;
    const cell = latest.current.cell();
    let last = { dx: 0, dy: 0 };
    try {
      target.setPointerCapture(pointer);
    } catch {
      // Capture refused (the pointer is already gone): the window listeners below still follow it.
    }

    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pointer) return;
      const px = ev.clientX - x0;
      const py = ev.clientY - y0;
      latest.current.onFrame?.(px, py);
      const dx = cellsFromDelta(px, cell.w, cell.gap);
      const dy = cellsFromDelta(py, cell.h, cell.gap);
      if (dx === last.dx && dy === last.dy) return;
      last = { dx, dy };
      latest.current.onMove(dx, dy);
    };
    const finish = (how: "end" | "cancel") => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("keydown", key, true);
      try {
        target.releasePointerCapture(pointer);
      } catch {
        // Already released.
      }
      stop.current = null;
      if (how === "cancel") latest.current.onCancel?.();
      latest.current.onEnd();
    };
    const up = (ev: PointerEvent) => ev.pointerId === pointer && finish("end");
    const cancel = (ev: PointerEvent) => ev.pointerId === pointer && finish("cancel");
    const key = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape") return;
      ev.preventDefault();
      ev.stopPropagation();
      finish("cancel");
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", key, true);
    stop.current = () => finish("cancel");
    latest.current.onStart?.();
  }, []);

  return { onPointerDown };
}
