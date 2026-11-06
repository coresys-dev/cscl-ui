import { useCallback, useRef } from "react";
import { wheelAction } from "../lib/overflow";

/** Whether something between `target` and `root` can still scroll vertically in the wheel's direction. */
function innerCanScrollY(target: EventTarget | null, root: HTMLElement, up: boolean): boolean {
  for (let n = target instanceof HTMLElement ? target : null; n && n !== root; n = n.parentElement) {
    const max = n.scrollHeight - n.clientHeight;
    if (max > 1 && /auto|scroll/.test(getComputedStyle(n).overflowY) && (up ? n.scrollTop > 0 : n.scrollTop < max - 1)) return true;
  }
  return false;
}

/**
 * Callback ref for a widget's content box. The widget's root element (its first child) is the scroller (the stylesheet
 * makes it so, scrollbar hidden): a wheel over the card scrolls it down, or sideways when only the width overflows,
 * and its clipped edges fade (`data-fade`, see theme/base.css) so the user can tell there is more.
 */
export function useWidgetOverflow() {
  const cleanup = useRef<(() => void) | null>(null);
  return useCallback((box: HTMLElement | null) => {
    cleanup.current?.();
    cleanup.current = null;
    if (!box) return;
    const rootOf = () => box.firstElementChild as HTMLElement | null;

    const onWheel = (e: WheelEvent) => {
      const root = rootOf();
      if (!root) return;
      const scale = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : 1;
      const act = wheelAction(
        { dx: e.deltaX * scale, dy: e.deltaY * scale, ctrl: e.ctrlKey },
        { top: root.scrollTop, left: root.scrollLeft, maxTop: root.scrollHeight - root.clientHeight, maxLeft: root.scrollWidth - root.clientWidth },
        innerCanScrollY(e.target, root, e.deltaY < 0),
      );
      if (act !== "x") return;
      e.preventDefault();
      root.scrollLeft += e.deltaY * scale;
    };

    let watched: HTMLElement | null = null;
    const fade = () => {
      const root = rootOf();
      if (!root) return;
      const maxTop = root.scrollHeight - root.clientHeight;
      const maxLeft = root.scrollWidth - root.clientWidth;
      const axis = maxTop > 1 ? "y" : maxLeft > 1 ? "x" : "";
      if (axis) root.dataset.fade = axis;
      else delete root.dataset.fade;
      const pos = axis === "y" ? root.scrollTop : root.scrollLeft;
      const max = axis === "y" ? maxTop : maxLeft;
      root.style.setProperty("--fade-start", axis && pos > 1 ? "24px" : "0px");
      root.style.setProperty("--fade-end", axis && pos < max - 1 ? "24px" : "0px");
    };
    const ro = new ResizeObserver(fade);
    const watch = () => {
      const root = rootOf();
      if (root === watched) return;
      if (watched) {
        ro.unobserve(watched);
        watched.removeEventListener("scroll", fade);
      }
      watched = root;
      if (root) {
        ro.observe(root);
        root.addEventListener("scroll", fade, { passive: true });
      }
      fade();
    };
    // The content growing changes the scroll size without resizing the box.
    const mo = new MutationObserver(() => {
      watch();
      fade();
    });
    mo.observe(box, { childList: true, subtree: true, characterData: true });
    watch();
    box.addEventListener("wheel", onWheel, { passive: false });
    cleanup.current = () => {
      box.removeEventListener("wheel", onWheel);
      mo.disconnect();
      ro.disconnect();
      watched?.removeEventListener("scroll", fade);
    };
  }, []);
}
