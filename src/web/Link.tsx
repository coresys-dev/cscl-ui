import { forwardRef, type AnchorHTMLAttributes } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "../lib/cn";

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** `inline` inside running text (default), `standalone` for a call to action with an arrow. */
  variant?: "inline" | "standalone";
  /** Opens in a new tab and swaps the arrow for an up-right arrow. */
  external?: boolean;
}

/** Text link. Inline links stay `color-text` with a muted underline that turns
 * accent on hover; never an accent-coloured link. */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(({ variant = "inline", external, className, children, ...props }, ref) => {
  const Arrow = external ? ArrowUpRight : ArrowRight;
  return (
    <a
      ref={ref}
      {...props}
      target={external ? "_blank" : props.target}
      rel={external ? "noreferrer" : props.rel}
      className={cn(
        "rounded-sm text-text transition-colors duration-150",
        variant === "inline"
          ? "underline decoration-text-muted decoration-1 underline-offset-[3px] hover:decoration-accent"
          : "group inline-flex min-h-11 items-center gap-1.5 text-sm font-medium no-underline",
        className,
      )}
    >
      {children}
      {variant === "standalone" && <Arrow size={16} className="transition-transform duration-200 group-hover:translate-x-[3px]" aria-hidden />}
    </a>
  );
});
Link.displayName = "Link";
