import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "../primitives/Button";

export interface ConsentDialogProps {
  title: string;
  body: string;
  allowLabel: string;
  declineLabel: string;
  onAllow: () => void;
  onDecline: () => void;
}

/** First-run consent prompt (e.g. anonymous telemetry/crash reporting). Same
 * layout as `ConfirmDialog` but with two neutral choices — no destructive
 * styling and no "cancel" semantics: Escape and backdrop click both count as
 * declining, which is a real, recorded decision, not a dismissal. */
export function ConsentDialog({ title, body, allowLabel, declineLabel, onAllow, onDecline }: ConsentDialogProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDecline();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onDecline]);

  return createPortal(
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onDecline}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-dialog-title"
        className="animate-modal-in w-full max-w-sm rounded-lg border border-border bg-surface p-4 shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="consent-dialog-title" className="mb-2 text-sm font-medium text-text">
          {title}
        </h2>
        <p className="mb-4 text-xs text-text-muted">{body}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onDecline}>
            {declineLabel}
          </Button>
          <Button variant="primary" size="sm" onClick={onAllow}>
            {allowLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
