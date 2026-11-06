import { Fragment } from "react";
import { cn } from "../lib/cn";

/** Keyboard shortcut, one keycap per key: `<Kbd keys={[MOD, "K"]} />`. */
export function Kbd({ keys, className }: { keys: string[]; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {keys.map((k, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <span className="text-[11px] text-text-muted" aria-hidden>
              +
            </span>
          )}
          <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm border border-b-2 border-border bg-surface-raised px-[5px] font-mono text-[11px] leading-none text-text-muted">
            {k}
          </kbd>
        </Fragment>
      ))}
    </span>
  );
}
