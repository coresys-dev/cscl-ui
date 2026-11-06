import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";

// Only the top-most overlay reacts to Escape and backdrop clicks.
const stack: number[] = [];
let seq = 0;

export function useOverlayStack(onClose: () => void, active = true) {
  const idRef = useRef(0);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!active) return;
    const id = ++seq;
    idRef.current = id;
    stack.push(id);
    const onKey = (e: KeyboardEvent) => {
      // An open inline menu (the editor's "/" menu) takes Escape for itself.
      if (e.key === "Escape" && stack[stack.length - 1] === id && !document.querySelector("[data-escape-guard]")) {
        e.preventDefault();
        e.stopPropagation();
        closeRef.current();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      const i = stack.indexOf(id);
      if (i >= 0) stack.splice(i, 1);
    };
  }, [active]);
  return () => stack[stack.length - 1] === idRef.current;
}

export function Modal({
  onClose,
  children,
  className,
  labelledBy,
  align = "center",
}: {
  onClose: () => void;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
  align?: "center" | "right" | "bottom";
}) {
  const isTop = useOverlayStack(onClose);
  const panel = useRef<HTMLDivElement>(null);
  const downOnBackdrop = useRef(false);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    // Only a field takes focus on open; otherwise the panel does, so no button shows a focus ring
    // the user never asked for.
    const first = panel.current?.querySelector<HTMLElement>("[autofocus], input:not([type=checkbox]):not([type=radio]), textarea");
    (first ?? panel.current)?.focus({ preventScroll: true });
    return () => prev?.focus?.({ preventScroll: true });
  }, []);

  return createPortal(
    <div
      className={cn(
        "animate-overlay-in fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm",
        // A side sheet starts below the title row, so it never runs under the window-controls island.
        align === "center" && "items-center justify-center p-6",
        align === "right" && "items-stretch justify-end p-3 pt-[60px]",
        // A bottom sheet leaves the page readable above it, so it is only lightly dimmed.
        align === "bottom" && "items-end justify-center bg-black/25 !backdrop-blur-none p-3",
      )}
      onMouseDown={(e) => (downOnBackdrop.current = e.target === e.currentTarget)}
      onClick={(e) => {
        if (e.target === e.currentTarget && downOnBackdrop.current && isTop()) onClose();
        downOnBackdrop.current = false;
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={cn(
          align === "bottom" ? "animate-sheet-up" : "animate-modal-in",
          "w-full max-w-sm rounded-lg border border-border bg-surface p-4 shadow-float outline-none",
          className,
        )}
        onKeyDown={(e) => {
          if (e.key !== "Tab" || !panel.current) return;
          const items = [
            ...panel.current.querySelectorAll<HTMLElement>(
              "a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])",
            ),
          ].filter((el) => el.offsetParent !== null);
          if (!items.length) return;
          const first = items[0];
          const last = items[items.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
