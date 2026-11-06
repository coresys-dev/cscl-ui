import { useCallback, useRef } from "react";

/**
 * Callback ref for a scroll container: fades its edges where content is hidden
 * (see .scroll-fade-x / .scroll-fade-y in index.css). Nothing fades at a resting edge.
 */
export function useScrollFade<T extends HTMLElement = HTMLElement>(axis: "x" | "y" = "y") {
  const cleanup = useRef<(() => void) | null>(null);
  return useCallback(
    (el: T | null) => {
      cleanup.current?.();
      cleanup.current = null;
      if (!el) return;
      el.classList.add(axis === "x" ? "scroll-fade-x" : "scroll-fade-y");
      const update = () => {
        const pos = axis === "x" ? el.scrollLeft : el.scrollTop;
        const max = axis === "x" ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight;
        el.style.setProperty("--fade-start", pos > 1 ? "28px" : "0px");
        el.style.setProperty("--fade-end", pos < max - 1 ? "28px" : "0px");
      };
      update();
      const ro = new ResizeObserver(update);
      ro.observe(el);
      // Content growing (cards added, a tab switched) changes the scroll size without resizing the box.
      const mo = new MutationObserver(update);
      mo.observe(el, { childList: true, subtree: true });
      el.addEventListener("scroll", update, { passive: true });
      cleanup.current = () => {
        ro.disconnect();
        mo.disconnect();
        el.removeEventListener("scroll", update);
      };
    },
    [axis],
  );
}
