import { useCallback, useRef } from "react";

/**
 * Callback ref for a horizontal scroll container: a vertical mouse wheel over it
 * scrolls it sideways while it has room to, then lets the page scroll as usual.
 */
export function useWheelScrollX<T extends HTMLElement = HTMLElement>() {
  const cleanup = useRef<(() => void) | null>(null);
  return useCallback((el: T | null) => {
    cleanup.current?.();
    cleanup.current = null;
    if (!el) return;
    // The wheel moves a target that the position eases toward, so notches glide instead of jumping.
    let target = 0;
    let frame = 0;
    const glide = () => {
      const left = el.scrollLeft;
      const step = (target - left) * 0.2;
      if (Math.abs(target - left) < 0.5) {
        el.scrollLeft = target;
        frame = 0;
        return;
      }
      el.scrollLeft = left + step;
      frame = requestAnimationFrame(glide);
    };
    const onWheel = (e: WheelEvent) => {
      // Trackpads already scroll sideways; only translate a mostly vertical gesture.
      if (e.ctrlKey || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      const from = frame ? target : el.scrollLeft;
      const atEdge = e.deltaY < 0 ? from <= 0 : from >= max - 1;
      if (atEdge) return;
      e.preventDefault();
      target = Math.min(max, Math.max(0, from + (e.deltaMode === WheelEvent.DOM_DELTA_LINE ? e.deltaY * 16 : e.deltaY)));
      if (!frame) frame = requestAnimationFrame(glide);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    cleanup.current = () => {
      el.removeEventListener("wheel", onWheel);
      cancelAnimationFrame(frame);
    };
  }, []);
}
