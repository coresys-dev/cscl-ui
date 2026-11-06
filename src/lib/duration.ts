/** `HH:MM:SS`, or `MM:SS` with `short` (minutes then grow past 59). Negative counts as 0. */
export function formatClock(totalSeconds: number, short = false): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const pad = (n: number) => String(n).padStart(2, "0");
  if (short) return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}
