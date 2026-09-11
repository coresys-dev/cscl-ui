import { forwardRef, useId, useMemo } from "react";

interface WordTickerProps {
  /** Distinct words to roll through, in order. Do NOT include a manual
   * duplicate of the first word at the end — unlike SLDR's original
   * `TICKER_WORDS`, this component appends that duplicate itself (see the
   * keyframe-generation comment below) so callers just pass the real list. */
  words: string[];
  onClick?: () => void;
  /** Home/landing = current page: faint fill to mark the active nav item. */
  active?: boolean;
  /** `false` until the surrounding nav has finished its own element-by-element
   * entrance: keeps the `active` fill hidden until then so it doesn't pop in
   * ahead of the rest of the staged reveal — it then fades in
   * (`transition-colors`) instead of appearing abruptly. No effect when
   * `active` is falsy. */
  revealed?: boolean;
  /** Collapsed-rail variant (icons-only sidebar): renders `compactWords`
   * (default: each word's first letter, uppercased) instead of `words`, in a
   * narrower square hit target. Never affects the ref target measured by
   * `BootTransitionSplash` (always the full ticker, see the ref comment
   * below). */
  compact?: boolean;
  /** Override for the compact rail's per-step labels. Defaults to the first
   * letter of each entry in `words` — pass this explicitly when that default
   * doesn't make sense (e.g. multi-byte first characters, or words that
   * shouldn't be abbreviated by initial). Must have the same length as
   * `words`. */
  compactWords?: string[];
  /** Accessible name for the click target when `onClick` is provided (the
   * rolling words themselves are decorative/`aria-hidden`). */
  ariaLabel?: string;
  /** Full cycle duration in ms — one pause-then-slide step per word, looping.
   * Default matches SLDR's original 5000ms. */
  cycleMs?: number;
  /** Height of one word's row, in rem (drives both the `overflow-hidden` box
   * height and the per-step translateY distance). Default matches SLDR's
   * `h-7` (1.75rem). */
  rowHeightRem?: number;
}

/** Fraction of each step's duration spent motionless before easing into the
 * next word — matches SLDR's original ratio (17.5% hold / 7.5% transition
 * out of each 25%-wide step, i.e. 0.7). */
const HOLD_FRACTION = 0.7;

function fmtPct(n: number): string {
  // Trim to at most 3 decimals so generated CSS stays readable; avoids
  // float noise like 42.49999999999999%.
  return `${Math.round(n * 1000) / 1000}%`;
}

/** Builds a `@keyframes` rule that pauses on each word's position then eases
 * to the next, for however many steps `words` needs — generalizing SLDR's
 * `roll-words` keyframe, which hardcoded percentages for exactly 5 steps
 * (its fixed word count).
 *
 * DESIGN CHOICE: rather than adding a fixed-step keyframe to
 * `theme/motion.css` (option (b) from the audit — simple, but silently wrong
 * or truncated for any `words.length` other than the one baked in) this
 * generates the keyframe per instance, sized exactly to `words.length`, and
 * injects it via a scoped `<style>` tag using a name derived from `useId()`
 * so multiple `WordTicker` instances with different word counts never
 * collide. This is the "per-instance inline `<style>` computing the keyframe
 * from `words.length`" option — it costs one extra tiny `<style>` element per
 * mounted ticker, but keeps the animation correct for any word list without
 * a shared CSS custom-property scheme that would need to encode a variable
 * number of transform steps (awkward: `@keyframes` percentages themselves
 * can't be parameterized by a CSS variable, only the values at each step
 * can — and the number of steps is exactly what varies here). */
function buildRollKeyframes(name: string, stepCount: number, rowHeightRem: number): string {
  const transitions = stepCount - 1; // one duplicated final step closes the loop seamlessly
  if (transitions <= 0) return `@keyframes ${name} { 100% { transform: translateY(0); } }`;
  const segment = 100 / transitions;
  const stops: string[] = [];
  for (let i = 0; i < transitions; i++) {
    const start = i * segment;
    const holdEnd = start + segment * HOLD_FRACTION;
    const y = -(i * rowHeightRem);
    stops.push(`${fmtPct(start)}, ${fmtPct(holdEnd)} { transform: translateY(${y}rem); }`);
  }
  stops.push(`100% { transform: translateY(${-(transitions * rowHeightRem)}rem); }`);
  return `@keyframes ${name} {\n  ${stops.join("\n  ")}\n}`;
}

/** Vertical word-roll ticker (an app's rolling-identity mark): one word shown
 * at a time, sliding to the next on a loop (see the keyframe-generation
 * comment above), centered in its container. Decorative, so hidden from
 * screen readers; if `onClick` is provided it also acts as a "back to home"
 * button (e.g. the sidebar's always-visible top nav item).
 *
 * The ref is forwarded to the `h-7`-equivalent box itself (not the
 * surrounding button): that's the precise target `BootTransitionSplash`
 * measures to land the startup roll exactly here (see its FLIP-transform
 * comment). */
export const WordTicker = forwardRef<HTMLDivElement, WordTickerProps>(function WordTicker(
  { words, onClick, active, revealed, compact, compactWords, ariaLabel, cycleMs = 5000, rowHeightRem = 1.75 },
  ref,
) {
  const rawId = useId();
  const keyframeName = useMemo(() => `word-ticker-roll-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`, [rawId]);

  const fullSteps = useMemo(() => [...words, words[0]], [words]);
  const compactSteps = useMemo(() => {
    const base = compactWords ?? words.map((w) => w.charAt(0).toUpperCase());
    return [...base, base[0]];
  }, [words, compactWords]);

  const steps = compact ? compactSteps : fullSteps;
  const keyframeCss = useMemo(
    () => buildRollKeyframes(keyframeName, steps.length, rowHeightRem),
    [keyframeName, steps.length, rowHeightRem],
  );

  const rowHeight = `${rowHeightRem}rem`;

  const content = (
    // `contain-layout`: without it, Safari/WebKit bubbles the animated
    // content's full (unclipped) height up to this box's own height despite
    // `overflow-hidden` — a flex ancestor (e.g. a sidebar column) ends up
    // with empty space sized for the words that shouldn't be visible.
    // Isolates this subtree from ancestor layout (WebKit-only bug, not seen
    // on Chromium).
    <div
      ref={compact ? undefined : ref}
      style={{ height: rowHeight }}
      className="overflow-hidden contain-layout"
      aria-hidden="true"
    >
      <style>{keyframeCss}</style>
      <div
        style={{
          animationName: keyframeName,
          animationDuration: `${cycleMs}ms`,
          animationTimingFunction: "var(--ease-in-out-quart)",
          animationIterationCount: "infinite",
        }}
        className="text-xl font-bold tracking-wide text-accent"
      >
        {steps.map((word, index) => (
          <div key={index} style={{ height: rowHeight, lineHeight: rowHeight }} className="text-center">
            {word}
          </div>
        ))}
      </div>
    </div>
  );

  if (!onClick) return content;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      className={`transition-colors duration-300 ${
        // Collapsed rail: same square `h-9 w-9` hit target as other rail
        // icons, for a consistent highlight instead of a full-width bar
        // squeezed onto a single letter.
        compact ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-md" : "w-full rounded-md py-1"
      } ${active && revealed ? "bg-accent-muted" : "hover:bg-surface-hover"}`}
    >
      {content}
    </button>
  );
});
