import type { CSSProperties, ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "../lib/cn";

export interface ProductRowProps {
  /** The product's app icon, shown at 56px. */
  icon: ReactNode;
  name: ReactNode;
  tagline?: ReactNode;
  description: ReactNode;
  href?: string;
  /** The product's `color-accent`, used only on the arrow. */
  accent?: string;
  className?: string;
}

/** One product in a list of products: icon, name, tagline, a sentence, and an
 * arrow when it links somewhere. Rows stack with 1px dividers. */
export function ProductRow({ icon, name, tagline, description, href, accent, className }: ProductRowProps) {
  const Row = href ? "a" : "div";
  return (
    <Row
      href={href}
      style={accent ? ({ "--cs-row-accent": accent } as CSSProperties) : undefined}
      className={cn(
        "group flex flex-wrap items-center gap-x-7 gap-y-5 border-b border-border py-6 text-text no-underline first:border-t",
        href && "focus-visible:rounded-md focus-visible:outline-offset-4",
        className,
      )}
    >
      <span className="inline-flex flex-none [&>img]:block [&>img]:size-14 [&>svg]:block [&>svg]:size-14">{icon}</span>
      <span className="flex flex-[0_0_200px] flex-col gap-0.5">
        <span className="text-[28px] font-bold leading-8 tracking-[-0.03em]">{name}</span>
        {tagline && <span className="text-xs text-text-muted">{tagline}</span>}
      </span>
      <span className="flex-[1_1_280px] text-[15px] leading-6 text-text-muted">{description}</span>
      {href && (
        <span
          aria-hidden
          className="inline-flex size-11 flex-none items-center justify-center rounded-full border border-border text-[var(--cs-row-accent,var(--color-text))] transition-[transform,border-color] duration-200 group-hover:translate-x-[3px] group-hover:border-[var(--cs-row-accent,var(--color-text))]"
        >
          <ArrowRight size={18} />
        </span>
      )}
    </Row>
  );
}
