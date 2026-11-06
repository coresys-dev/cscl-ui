// Playback and timecodes for media players. Pure: no DOM, no interface text.

export type PlaybackState = "loading" | "ready" | "unsupported";

/** Without `loadedmetadata` after this long, the webview is taken not to read the file. */
export const STALLED_TIMEOUT_MS = 12_000;

export const RATES = [0.5, 1, 1.5, 2] as const;

/** Next state on a media event. Metadata always wins (a slow disk may answer after
 * the timeout); the timeout only gives up on a file that is still loading. */
export function playbackState(ev: "loadedmetadata" | "error" | "stalled-timeout", current: PlaybackState): PlaybackState {
  if (ev === "loadedmetadata") return "ready";
  if (ev === "error") return "unsupported";
  return current === "loading" ? "unsupported" : current;
}

/** L: plays at 1× from a pause, then steps up 1× → 1.5× → 2× while already playing. */
export function forwardRate(playing: boolean, rate: number): number {
  if (!playing) return 1;
  return [1, 1.5, 2].find((r) => r > rate) ?? 2;
}

/** The speed button: the next rate in RATES, back to the first after the last. */
export function nextRate(rate: number): number {
  return RATES.find((r) => r > rate) ?? RATES[0];
}

const pad = (n: number) => String(n).padStart(2, "0");
const safe = (seconds: number) => (Number.isFinite(seconds) && seconds > 0 ? seconds : 0);

/** The frame rate to time with: 25 when it is unknown (0) or unusable. */
export const safeFps = (fps: number) => (Number.isFinite(fps) && fps >= 1 ? fps : 25);

/** `HH:MM:SS:FF` at the given frame rate. */
export function formatTimecode(seconds: number, fps: number): string {
  const s = safe(seconds);
  const rate = safeFps(fps);
  const whole = Math.floor(s);
  // The epsilon absorbs float noise (0.12 * 25 = 2.9999…).
  const frame = Math.min(Math.floor((s - whole) * rate + 1e-6), Math.ceil(rate) - 1);
  return `${pad(Math.floor(whole / 3600))}:${pad(Math.floor((whole % 3600) / 60))}:${pad(whole % 60)}:${pad(frame)}`;
}

/** `M:SS`, or `H:MM:SS` from an hour. */
export function formatShort(seconds: number): string {
  const whole = Math.floor(safe(seconds));
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = whole % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// One pattern per format, tried in order: h:m:s:f, h:m:s, m:s, XmYs, Ns.
const FORMS: { re: RegExp; toSeconds: (g: string[], fps: number) => number }[] = [
  { re: /^(\d{1,2}):(\d{2}):(\d{2}):(\d{2})/, toSeconds: (g, fps) => +g[1] * 3600 + +g[2] * 60 + +g[3] + +g[4] / fps },
  { re: /^(\d{1,2}):(\d{2}):(\d{2})/, toSeconds: (g) => +g[1] * 3600 + +g[2] * 60 + +g[3] },
  { re: /^(\d{1,3}):(\d{2})/, toSeconds: (g) => +g[1] * 60 + +g[2] },
  { re: /^(\d+)m(\d{1,2})s?/, toSeconds: (g) => +g[1] * 60 + +g[2] },
  { re: /^(\d+)s/, toSeconds: (g) => +g[1] },
];

const round = (n: number) => Math.round(n * 1e6) / 1e6;

/** A whole string as a timecode (`2:14`, `[02:14]`, `1:02:14`, `00:02:14:12`, `2m14s`, `134s`); null otherwise. */
export function parseTimecode(s: string, fps: number): number | null {
  const t = s
    .trim()
    .replace(/^[[(]/, "")
    .replace(/[\])]$/, "");
  const rate = safeFps(fps);
  for (const form of FORMS) {
    const m = form.re.exec(t);
    if (!m) continue;
    // A timecode glued to a digit or a letter is not one.
    if (/^(?:[\d\p{L}]|:(?=\S))/u.test(t.slice(m[0].length))) continue;
    return m[0].length === t.length ? round(form.toSeconds(m, rate)) : null;
  }
  return null;
}
