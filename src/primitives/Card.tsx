import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** A tile that opens something: gains a border that lifts to the accent on hover. */
  interactive?: boolean;
}

/** Flush surface in normal flow. A floating panel (modal, menu, popover) uses `shadow-float` instead. */
export function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-surface-raised shadow-card",
        interactive && "border border-border transition-[border-color,box-shadow] duration-150 hover:border-accent/60 hover:shadow-float hover:shadow-glow",
        className,
      )}
      {...props}
    />
  );
}
