import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface HeroProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** A mark, screenshot or illustration beside the copy (stacks under it below 820px). */
  media?: ReactNode;
  align?: "start" | "center";
  /** Heading element, `h1` by default. */
  titleAs?: "h1" | "h2";
  className?: string;
}

/** The opening of a web page: eyebrow, a large Sora 700 headline (up to 104px,
 * sized to the hero's own width), a line of description and the actions. */
export function Hero({ eyebrow, title, description, actions, media, align = "start", titleAs: Title = "h1", className }: HeroProps) {
  const center = align === "center";
  return (
    <section className={cn("@container", className)}>
      <div
        className={cn(
          "grid items-center gap-12 pb-14 pt-16 @[820px]:pb-[88px] @[820px]:pt-24",
          media && "@[820px]:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]",
          center && "justify-items-center text-center",
        )}
      >
        <div className={cn("flex min-w-0 flex-col gap-6", center && "items-center")}>
          {eyebrow && <p className="m-0 text-xs font-medium uppercase tracking-[0.08em] text-text-muted">{eyebrow}</p>}
          <Title
            className={cn("m-0 text-balance text-[clamp(40px,8cqi,104px)] font-bold leading-[0.98] tracking-[-0.04em] text-text", center && "max-w-[1000px]")}
          >
            {title}
          </Title>
          {description && <p className="m-0 max-w-[600px] text-lg leading-7 text-text-muted">{description}</p>}
          {actions && <div className="mt-2 flex flex-wrap gap-3">{actions}</div>}
        </div>
        {media && <div className="flex min-w-0 items-center justify-center">{media}</div>}
      </div>
    </section>
  );
}
