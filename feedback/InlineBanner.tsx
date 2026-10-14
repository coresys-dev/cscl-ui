import { cn } from "../lib/cn";

type InlineBannerVariant = "error" | "warning" | "info";

interface InlineBannerProps {
  message: string;
  /** Label shown on the action button in its idle state. Omit both this and
   * `onRetry` for a banner with no action, just a message. */
  retryLabel?: string;
  /** Label shown while `retrying` is true (e.g. "Retrying…"). Falls back to
   * `retryLabel` if not given. */
  retryingLabel?: string;
  /** `true` while a retry is in flight: the button disables and swaps to
   * `retryingLabel`. */
  retrying?: boolean;
  onRetry?: () => void;
  /** Visual severity. Defaults to `"error"`. Kept in sync with
   * `ToastProvider`'s variant palette (`accent` for the "ok" tone doesn't
   * apply here, so this reuses `danger`/`warning`/plain-text instead). */
  variant?: InlineBannerVariant;
  className?: string;
}

const VARIANT_CLASSES: Record<InlineBannerVariant, { wrap: string; button: string }> = {
  error: {
    wrap: "border-danger/40 bg-danger/10 text-danger",
    button: "bg-danger/20 hover:bg-danger/30",
  },
  warning: {
    wrap: "border-accent-2/40 bg-accent-2/10 text-accent-2",
    button: "bg-accent-2/20 hover:bg-accent-2/30",
  },
  info: {
    wrap: "border-border bg-surface-hover text-text",
    button: "bg-surface-raised hover:bg-border/40",
  },
};

/** Non-blocking inline banner (never a modal or toast) for surfacing a
 * recoverable failure — e.g. a background reload that failed — while leaving
 * whatever's already on screen (a list's last-known data, etc.) visible. Sits
 * flush in the flow right above/below the content it concerns. Renders no
 * action at all when neither `retryLabel` nor `onRetry` is given. */
export function InlineBanner({
  message,
  retryLabel,
  retryingLabel,
  retrying = false,
  onRetry,
  variant = "error",
  className,
}: InlineBannerProps) {
  const styles = VARIANT_CLASSES[variant];
  return (
    <div
      role="status"
      className={cn(
        "mx-2 my-1 flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs",
        styles.wrap,
        className,
      )}
    >
      <span>{message}</span>
      {onRetry && retryLabel && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className={cn("shrink-0 rounded-sm px-2 py-1 transition-colors disabled:opacity-50", styles.button)}
        >
          {retrying ? (retryingLabel ?? retryLabel) : retryLabel}
        </button>
      )}
    </div>
  );
}
