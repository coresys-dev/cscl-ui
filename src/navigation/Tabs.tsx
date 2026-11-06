import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { useWheelScrollX } from "../lib/useWheelScrollX";

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
  count?: number;
}

/** CoreSys Tabs, list only: panels are rendered by the caller. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  tabs: TabItem<T>[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  const wheelX = useWheelScrollX();
  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <div ref={wheelX} role="tablist" aria-label={ariaLabel} className="no-scrollbar flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border">
        {tabs.map((t) => {
          const sel = t.id === value;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={sel}
              tabIndex={sel ? 0 : -1}
              className={cn(
                "group relative -mb-px inline-flex h-10 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors duration-150 disabled:cursor-default disabled:opacity-50",
                sel ? "border-accent text-text" : "border-transparent text-text-muted hover:text-text",
              )}
              onClick={() => onChange(t.id)}
              onKeyDown={(e) => {
                const i = tabs.findIndex((x) => x.id === value);
                if (e.key === "ArrowRight") onChange(tabs[(i + 1) % tabs.length].id);
                if (e.key === "ArrowLeft") onChange(tabs[(i - 1 + tabs.length) % tabs.length].id);
              }}
            >
              {t.label}
              {t.count !== undefined && (
                <span
                  className={cn(
                    "inline-flex h-[18px] items-center rounded-full px-1.5 text-[11px]",
                    sel ? "bg-accent-muted text-accent" : "bg-surface-raised text-text-muted",
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
