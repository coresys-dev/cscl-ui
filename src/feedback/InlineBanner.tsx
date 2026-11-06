import type { ReactNode } from "react";
import { CircleCheck } from "lucide-react";
import { cn } from "../lib/cn";

export type InlineBannerVariant = "error" | "warning" | "info" | "success";

export interface InlineBannerProps {
  message: ReactNode;
  variant?: InlineBannerVariant;
  /** A button or link at the end of the banner. */
  action?: ReactNode;
  className?: string;
}

const VARIANT_CLASSES: Record<InlineBannerVariant, string> = {
  error: "border-danger/40 bg-danger/10 text-danger",
  warning: "border-accent-2/40 bg-accent-2/10 text-accent-2",
  info: "border-border bg-surface-hover text-text",
  success: "border-transparent bg-accent-muted text-text",
};

/** Non-blocking banner that sits flush in the flow next to what it concerns —
 * copied from `cscl-ui` `feedback/InlineBanner.tsx`, with a `success` tone
 * (key redeemed) and a free-form `action` in place of the retry pair. */
export function InlineBanner({ message, variant = "error", action, className }: InlineBannerProps) {
  return (
    <div role="status" className={cn("flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-xs", VARIANT_CLASSES[variant], className)}>
      {variant === "success" && (
        <span className="flex text-accent" aria-hidden="true">
          <CircleCheck size={16} />
        </span>
      )}
      <span className="flex-1">{message}</span>
      {action}
    </div>
  );
}
