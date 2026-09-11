import { Button, type ButtonProps } from "../primitives/Button";

interface FatalErrorAction {
  label: string;
  onClick: () => void;
  /** Defaults to `"secondary"`; use `"primary"` for the main recovery action
   * (e.g. "Retry"). */
  variant?: ButtonProps["variant"];
}

interface FatalErrorScreenProps {
  title: string;
  /** Raw error detail — rendered pre-wrapped, so backend stack traces /
   * multi-line messages stay readable. */
  message: string;
  /** Recovery actions rendered left to right, e.g. retry / open data folder /
   * quit. At least one is expected, but none is required. */
  actions: FatalErrorAction[];
}

/** Full-screen, blocking overlay for an unrecoverable error — nothing else of
 * the app is mounted underneath it, so only use this when there's truly
 * nothing else to show (e.g. the app's data store failed to open). For a
 * recoverable failure that shouldn't hide the rest of the UI, use
 * `InlineBanner` instead. */
export function FatalErrorScreen({ title, message, actions }: FatalErrorScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-bg p-8 text-center text-text">
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="max-w-md whitespace-pre-wrap break-words text-sm text-text-muted">{message}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {actions.map((action, i) => (
          <Button key={i} variant={action.variant ?? "secondary"} onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
