import { forwardRef, useCallback, type HTMLAttributes } from "react";
import { useScrollFade } from "../lib/useScrollFade";

/** A scroll container whose edges fade where content is hidden. The caller still sets the overflow class. */
export const ScrollArea = forwardRef<HTMLElement, HTMLAttributes<HTMLElement> & { as?: "div" | "main" | "aside" | "nav"; axis?: "x" | "y" }>(
  ({ as: Tag = "div", axis = "y", ...props }, forwarded) => {
    const fade = useScrollFade(axis);
    const ref = useCallback(
      (el: HTMLElement | null) => {
        fade(el);
        if (typeof forwarded === "function") forwarded(el);
        else if (forwarded) forwarded.current = el;
      },
      [fade, forwarded],
    );
    return <Tag ref={ref as never} {...props} />;
  },
);
ScrollArea.displayName = "ScrollArea";
