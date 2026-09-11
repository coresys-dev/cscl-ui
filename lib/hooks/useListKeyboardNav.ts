import { useEffect } from "react";

interface UseListKeyboardNavArgs<T> {
  /** `false`: no listener is attached — use when this list isn't the active
   * one (e.g. several list views stay mounted at once and only one should
   * react to the keyboard at a time). */
  enabled: boolean;
  items: T[];
  selected: T | null;
  getId: (item: T) => string | number;
  onSelect: (item: T) => void;
  /** Called on Space — e.g. toggle play/pause on the selected item. */
  onActivate: () => void;
}

/** Ignores the shortcut if focus is on an input or a real `<button>`: the key
 * should then keep its native behavior (typing a space, activating the
 * button). Custom `role="button"` rows have no native keyboard activation,
 * so leaving those out here would let the browser reclaim Space/arrows for
 * page scroll instead of firing these shortcuts. */
function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName)) return true;
  return target.isContentEditable;
}

/** Global keyboard nav for a selectable list: Space activates the current
 * selection (e.g. play/pause), Up/Down arrows move the selection to the
 * previous/next item. */
export function useListKeyboardNav<T>({
  enabled,
  items,
  selected,
  getId,
  onSelect,
  onActivate,
}: UseListKeyboardNavArgs<T>) {
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e: KeyboardEvent) {
      if (isInteractiveTarget(e.target)) return;

      if (e.key === " ") {
        e.preventDefault();
        onActivate();
        return;
      }

      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && items.length > 0) {
        e.preventDefault();
        const currentIndex = selected ? items.findIndex((item) => getId(item) === getId(selected)) : -1;
        const delta = e.key === "ArrowDown" ? 1 : -1;
        const nextIndex = Math.min(items.length - 1, Math.max(0, currentIndex + delta));
        onSelect(items[nextIndex]);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, items, selected, getId, onSelect, onActivate]);
}
