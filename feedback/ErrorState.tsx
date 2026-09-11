export interface ErrorStateProps {
  error: unknown;
  /** Turns `error` into display text. Defaults to `error.message` for a real
   * `Error`, `String(error)` otherwise — pass this when your app's errors
   * carry a richer shape (e.g. a tagged union with its own `reason` field). */
  formatError?: (error: unknown) => string;
}

/** Inline error banner: a red-tinted block with the message, no chrome
 * beyond that. For a whole-screen failure use `FatalErrorScreen` instead;
 * this is for a single section/panel that failed to load. */
export function ErrorState({ error, formatError }: ErrorStateProps) {
  const message = formatError ? formatError(error) : error instanceof Error ? error.message : String(error);
  return (
    <div className="rounded-lg border border-danger/40 bg-danger-muted p-4 text-sm text-danger">{message}</div>
  );
}
