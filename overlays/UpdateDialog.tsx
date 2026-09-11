import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "../primitives/Button";

export interface UpdateInfo {
  /** Release notes / changelog for the pending update, if any. */
  notes?: string | null;
}

/** Where the self-update flow currently is:
 * - `prompt` — an update is available, awaiting the user's "now"/"later"
 * - `updating` — downloading + silently installing (shows progress)
 * - `installed` — the new binary is on disk, awaiting the restart prompt
 * - `restarting` — the user accepted; the app is about to relaunch
 */
export type UpdateStage = "prompt" | "updating" | "installed" | "restarting";

export interface UpdateDialogProps<TProgress> {
  update: UpdateInfo;
  title: string;
  body: string;
  installedTitle: string;
  installedBody: string;
  updateNowLabel: string;
  laterLabel: string;
  retryLabel: string;
  restartNowLabel: string;
  progressLabel: (event: TProgress | null) => string;
  restartingLabel: string;
  stage: UpdateStage;
  progress: TProgress | null;
  error: string | null;
  onUpdateNow: () => void;
  onRestart: () => void;
  onLater: () => void;
}

/** Same modal chrome as `ConfirmDialog` (blurred backdrop, Escape closes).
 * Models a self-update flow that runs discreetly in place and does NOT
 * relaunch on its own — once it lands, the dialog switches to an "installed,
 * restart now?" prompt. "Later" is a full dismissal at either the prompt or
 * the installed stage (the update simply applies on the next natural
 * launch), so there's no destructive/red button here.
 *
 * `TProgress` is your app's own download-progress event shape — this
 * component never inspects it directly, only threads it through to
 * `progressLabel`. */
export function UpdateDialog<TProgress>({
  update,
  title,
  body,
  installedTitle,
  installedBody,
  updateNowLabel,
  laterLabel,
  retryLabel,
  restartNowLabel,
  progressLabel,
  restartingLabel,
  stage,
  progress,
  error,
  onUpdateNow,
  onRestart,
  onLater,
}: UpdateDialogProps<TProgress>) {
  const dismissible = stage === "prompt" || stage === "installed";

  useEffect(() => {
    if (!dismissible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onLater();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismissible, onLater]);

  const installed = stage === "installed" || stage === "restarting";

  let primaryLabel: string;
  if (stage === "updating") primaryLabel = progress ? progressLabel(progress) : restartingLabel;
  else if (stage === "restarting") primaryLabel = restartingLabel;
  else if (stage === "installed") primaryLabel = restartNowLabel;
  else primaryLabel = error ? retryLabel : updateNowLabel;

  return createPortal(
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={dismissible ? onLater : undefined}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-dialog-title"
        className="animate-modal-in w-full max-w-sm rounded-lg border border-border bg-surface p-4 shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="update-dialog-title" className="mb-2 text-sm font-medium text-text">
          {installed ? installedTitle : title}
        </h2>
        {installed ? (
          <p className="mb-4 text-xs text-text-muted">{installedBody}</p>
        ) : (
          <>
            <p className="mb-1 text-xs text-text-muted">{body}</p>
            {update.notes ? (
              <p className="mb-4 whitespace-pre-line text-xs leading-relaxed text-text-muted">{update.notes}</p>
            ) : (
              <div className="mb-4" />
            )}
          </>
        )}
        {error && <p className="mb-3 text-xs font-medium text-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          {dismissible && (
            <Button variant="secondary" size="sm" onClick={onLater}>
              {laterLabel}
            </Button>
          )}
          <Button
            size="sm"
            disabled={stage === "updating" || stage === "restarting"}
            onClick={stage === "installed" ? onRestart : onUpdateNow}
          >
            {primaryLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
