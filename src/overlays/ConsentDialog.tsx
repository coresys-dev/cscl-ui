import { useId } from "react";
import { Button } from "../primitives/Button";
import { Modal } from "./Modal";

export interface ConsentDialogProps {
  title: string;
  body: string;
  allowLabel: string;
  declineLabel: string;
  onAllow: () => void;
  onDecline: () => void;
}

/** First-run two-choice prompt (crash reports, telemetry). Same layout as
 * `ConfirmDialog` but with two neutral choices and no "cancel": Escape and a
 * backdrop click both count as declining, a real recorded decision. */
export function ConsentDialog({ title, body, allowLabel, declineLabel, onAllow, onDecline }: ConsentDialogProps) {
  const id = useId();
  return (
    <Modal onClose={onDecline} labelledBy={id}>
      <h2 id={id} className="mb-2 text-sm font-medium text-text">
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
    </Modal>
  );
}
