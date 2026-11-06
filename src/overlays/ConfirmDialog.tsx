import { useId, type ReactNode } from "react";
import { Button } from "../primitives/Button";
import { Modal } from "./Modal";

export interface ConfirmDialogProps {
  /** Ask the whole question: "Remove this folder from your library?" */
  title: string;
  body?: ReactNode;
  /** Name the act: "Remove", "Run", "Update now" — never "OK". */
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** `"destructive"` (default) for an irreversible act, `"primary"` for a plain confirmation. */
  confirmVariant?: "destructive" | "primary";
  /** Optional third choice next to cancel, e.g. "Merge" next to "Replace". */
  altLabel?: string;
  onAlt?: () => void;
  /** Extra content between the body and the buttons: a checkbox, a field. */
  content?: ReactNode;
}

/** Declarative confirmation dialog on `Modal` (focus trap, Escape, backdrop
 * click). For a one-off `await confirm(...)` from an event handler, use
 * `useDialogs()` instead. */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  confirmVariant = "destructive",
  altLabel,
  onAlt,
  content,
}: ConfirmDialogProps) {
  const id = useId();
  return (
    <Modal onClose={onCancel} labelledBy={id} className={altLabel ? "max-w-md" : undefined}>
      <h2 id={id} className="mb-2 text-sm font-medium text-text">
        {title}
      </h2>
      {body && <div className="mb-4 whitespace-pre-line text-xs leading-relaxed text-text-muted">{body}</div>}
      {content}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          {cancelLabel}
        </Button>
        {altLabel && onAlt && (
          <Button variant="secondary" size="sm" onClick={onAlt}>
            {altLabel}
          </Button>
        )}
        <Button variant={confirmVariant} size="sm" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
