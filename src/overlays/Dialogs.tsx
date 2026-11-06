import { createContext, useCallback, useContext, useId, useState, type ReactNode } from "react";
import { Button } from "../primitives/Button";
import { TextField } from "../inputs/Field";
import { ConfirmDialog } from "./ConfirmDialog";
import { Modal } from "./Modal";

export interface ConfirmOptions {
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Red confirm button. Default `true`. */
  destructive?: boolean;
  /** Optional third choice, e.g. "Merge" next to "Replace". Resolves to `"alt"`. */
  altLabel?: string;
}

export interface PromptOptions {
  title: string;
  body?: ReactNode;
  label?: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel: string;
  cancelLabel?: string;
}

type Pending =
  | { kind: "confirm"; opts: ConfirmOptions; resolve: (v: boolean | "alt") => void }
  | { kind: "prompt"; opts: PromptOptions; resolve: (v: string | null) => void };

export interface DialogsValue {
  /** `true` on confirm, `false` on cancel/Escape, `"alt"` on the third choice. */
  confirm: (o: ConfirmOptions) => Promise<boolean | "alt">;
  /** The trimmed text, or `null` when cancelled or empty. */
  prompt: (o: PromptOptions) => Promise<string | null>;
}

const Ctx = createContext<DialogsValue | null>(null);

/** Promise-based dialogs: `if (await dialogs.confirm({...})) remove()`.
 * Requests queue up and show one at a time. `cancelLabel` is the fallback
 * for every dialog that doesn't set its own. */
export function DialogsProvider({ children, cancelLabel = "Cancel" }: { children: ReactNode; cancelLabel?: string }) {
  const [queue, setQueue] = useState<Pending[]>([]);
  const confirm = useCallback(
    (opts: ConfirmOptions) => new Promise<boolean | "alt">((resolve) => setQueue((q) => [...q, { kind: "confirm", opts, resolve }])),
    [],
  );
  const prompt = useCallback((opts: PromptOptions) => new Promise<string | null>((resolve) => setQueue((q) => [...q, { kind: "prompt", opts, resolve }])), []);
  const current = queue[0];
  const settle = <T,>(resolve: (v: T) => void, v: T) => {
    resolve(v);
    setQueue((q) => q.slice(1));
  };
  return (
    <Ctx.Provider value={{ confirm, prompt }}>
      {children}
      {current?.kind === "confirm" && (
        <ConfirmDialog
          title={current.opts.title}
          body={current.opts.body}
          confirmLabel={current.opts.confirmLabel}
          cancelLabel={current.opts.cancelLabel ?? cancelLabel}
          confirmVariant={current.opts.destructive === false ? "primary" : "destructive"}
          altLabel={current.opts.altLabel}
          onAlt={() => settle(current.resolve, "alt" as const)}
          onConfirm={() => settle(current.resolve, true)}
          onCancel={() => settle(current.resolve, false)}
        />
      )}
      {current?.kind === "prompt" && (
        <PromptDialog {...current.opts} cancelLabel={current.opts.cancelLabel ?? cancelLabel} onResult={(v) => settle(current.resolve, v)} />
      )}
    </Ctx.Provider>
  );
}

export function useDialogs(): DialogsValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDialogs must be used within DialogsProvider");
  return v;
}

function PromptDialog({
  title,
  body,
  label,
  placeholder,
  initialValue = "",
  confirmLabel,
  cancelLabel,
  onResult,
}: PromptOptions & { onResult: (v: string | null) => void }) {
  const id = useId();
  const [value, setValue] = useState(initialValue);
  return (
    <Modal onClose={() => onResult(null)} labelledBy={id}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onResult(value.trim() || null);
        }}
      >
        <h2 id={id} className="mb-2 text-sm font-medium text-text">
          {title}
        </h2>
        {body && <div className="mb-3 text-xs text-text-muted">{body}</div>}
        <TextField
          label={label}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          onFocus={(e) => e.currentTarget.select()}
          className="mb-4"
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => onResult(null)}>
            {cancelLabel}
          </Button>
          <Button type="submit" size="sm" disabled={!value.trim()}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
