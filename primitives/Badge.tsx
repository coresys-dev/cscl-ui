import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] uppercase tracking-wide",
  {
    variants: {
      tone: {
        neutral: "border border-border text-text-muted",
        accent: "border border-accent/40 bg-accent-muted text-accent",
        attention: "border border-accent-2/40 bg-accent-2-muted text-accent-2",
        danger: "border border-danger/40 bg-danger-muted text-danger",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

/** Small pill for a status/count/label — a version tag, an "installed"
 * marker, a category chip. Four tones only (`neutral`/`accent`/`attention`/
 * `danger`); pick by meaning, not by where it's used. */
export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
