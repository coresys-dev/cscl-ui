import type { ComponentType, ReactNode } from "react";
import { cn } from "../lib/cn";

export interface FeatureItem {
  title: ReactNode;
  description?: ReactNode;
  icon?: ComponentType<{ size?: number }>;
}

export interface FeatureGridProps {
  items: FeatureItem[];
  /** Prefix each item with 01, 02… */
  numbered?: boolean;
  className?: string;
}

/** Three or four short selling points side by side, wrapping to fewer columns as space shrinks. */
export function FeatureGrid({ items, numbered, className }: FeatureGridProps) {
  return (
    <div className={cn("grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-8 border-t border-border pt-7", className)}>
      {items.map(({ title, description, icon: Icon }, i) => (
        <div key={i} className="flex flex-col gap-2">
          {numbered && <span className="text-xs font-medium tabular-nums tracking-[0.08em] text-text-muted">{String(i + 1).padStart(2, "0")}</span>}
          {Icon && (
            <span className="inline-flex text-text-muted">
              <Icon size={20} />
            </span>
          )}
          <h3 className="m-0 text-[17px] font-medium leading-6 text-text">{title}</h3>
          {description && <p className="m-0 text-sm leading-[22px] text-text-muted">{description}</p>}
        </div>
      ))}
    </div>
  );
}
