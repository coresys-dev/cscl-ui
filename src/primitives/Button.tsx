import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** The one main action of a view. */
        primary: "bg-accent text-bg transition-[filter,box-shadow,transform] hover:shadow-glow hover:brightness-110 active:scale-[0.98]",
        secondary: "border border-border bg-surface-raised text-text hover:bg-surface-hover active:scale-[0.98]",
        ghost: "bg-transparent text-text-muted hover:bg-surface-hover hover:text-text active:scale-[0.98]",
        destructive: "border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20 active:scale-[0.98]",
        /** Needs attention without being destructive: an outdated version, a pending update. */
        warning: "border border-accent-2/40 bg-accent-2-muted text-accent-2 hover:bg-accent-2/20 active:scale-[0.98]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 text-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

/** Text button. Name the act ("Remove", "Update now"), never "OK". */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, type = "button", ...props }, ref) => (
  <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = "Button";
