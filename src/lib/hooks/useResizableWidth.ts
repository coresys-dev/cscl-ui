import { useCallback, useRef, useState } from "react";

interface UseResizableWidthResult {
  width: number;
  dragging: boolean;
  elementRef: React.RefObject<HTMLElement | null>;
  onResizeStart: (e: React.PointerEvent) => void;
}

/** Width adjustable via a side handle: the width is written straight to the
 * DOM during the drag (no React re-render per `pointermove`), React state is
 * only updated once the drag ends. Also the base pattern for any other
 * pointer-driven drag interaction (see cscl-ui's tree/list drag-and-drop
 * components) — window-level pointermove/pointerup listeners set up on
 * pointerdown and torn down on pointerup, rather than the native HTML5 Drag
 * API (which Tauri's window-level `dragDropEnabled` can swallow before it
 * reaches the DOM on Windows/WebView2 — see window/README.md). */
export function useResizableWidth(defaultWidth: number, min: number, max: number): UseResizableWidthResult {
  const [width, setWidth] = useState(defaultWidth);
  const [dragging, setDragging] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  const onResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = elementRef.current?.getBoundingClientRect().width ?? width;
      setDragging(true);

      const clamp = (value: number) => Math.min(max, Math.max(min, value));

      const onMove = (moveEvent: PointerEvent) => {
        const next = clamp(startWidth + (moveEvent.clientX - startX));
        if (elementRef.current) elementRef.current.style.width = `${next}px`;
      };
      const onUp = (upEvent: PointerEvent) => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        setDragging(false);
        setWidth(clamp(startWidth + (upEvent.clientX - startX)));
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [width, min, max],
  );

  return { width, dragging, elementRef, onResizeStart };
}
