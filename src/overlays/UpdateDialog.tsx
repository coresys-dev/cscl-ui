import { Button } from "../primitives/Button";
import { Modal } from "./Modal";

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

  const installed = stage === "installed" || stage === "restarting";

  let primaryLabel: string;
  if (stage === "updating") primaryLabel = progress ? progressLabel(progress) : restartingLabel;
  else if (stage === "restarting") primaryLabel = restartingLabel;
  else if (stage === "installed") primaryLabel = restartNowLabel;
  else primaryLabel = error ? retryLabel : updateNowLabel;

  return (
    <Modal onClose={dismissible ? onLater : () => {}} labelledBy="update-dialog-title" className="max-w-sm">
      <h2 id="update-dialog-title" className="mb-2 text-sm font-medium text-text">
        {installed ? installedTitle : title}
      </h2>
      {installed ? (
        <p className="mb-4 text-xs text-text-muted">{installedBody}</p>
      ) : (
        <>
          <p className="mb-1 text-xs text-text-muted">{body}</p>
          {update.notes ? <p className="mb-4 whitespace-pre-line text-xs leading-relaxed text-text-muted">{update.notes}</p> : <div className="mb-4" />}
        </>
      )}
      {error && <p className="mb-3 text-xs font-medium text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        {dismissible && (
          <Button variant="secondary" size="sm" onClick={onLater}>
            {laterLabel}
          </Button>
        )}
        <Button size="sm" disabled={stage === "updating" || stage === "restarting"} onClick={stage === "installed" ? onRestart : onUpdateNow}>
          {primaryLabel}
        </Button>
      </div>
    </Modal>
  );
}
