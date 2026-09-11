import { useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { useTypewriterPlaceholder } from "../lib/hooks/useTypewriterPlaceholder";
import { cn } from "../lib/cn";

interface HeroSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  /** Cycled through by the typewriter placeholder effect (must be a stable
   * reference — a module constant or memoized array). */
  placeholderWords: readonly string[];
  /** Static text shown before the typed word, e.g. "Search for ". */
  placeholderPrefix?: string;
  /** `false` keeps the whole field invisible — use while whatever gates the
   * entrance (a splash screen, a layout measurement) hasn't finished yet. */
  revealed: boolean;
  /** `true` only for the reveal you actually want animated (typically just
   * the very first mount): plays the mask entrance. Set to `false` on
   * subsequent mounts of this component so the animation doesn't replay
   * every time it's remounted (e.g. navigating back to a home screen). */
  playIntro: boolean;
  /** Called once the intro animation finishes (or is cut short by unmounting
   * mid-animation) — flip `playIntro` to `false` in response so it never
   * replays. */
  onIntroPlayed: () => void;
  /** Reveal animation duration in ms; must match (or drive) the
   * `animate-reveal-mask` keyframe's actual duration. */
  revealDurationMs?: number;
  className?: string;
}

const DEFAULT_REVEAL_MS = 900;

/** Hero search field with a `clip-path` "reveal mask" entrance (the field's
 * own rounded-rect shape re-opens from its center, so the typewriter text
 * appears to type "through" the field body rather than a body growing
 * around text that's already there) and a typewriter-effect placeholder.
 *
 * Extracts just the input-reveal mechanism — no search/navigation logic of
 * its own: wire `value`/`onChange`/`onSubmit` to whatever behavior you need. */
export function HeroSearchInput({
  value,
  onChange,
  onSubmit,
  placeholderWords,
  placeholderPrefix = "",
  revealed,
  playIntro,
  onIntroPlayed,
  revealDurationMs = DEFAULT_REVEAL_MS,
  className,
}: HeroSearchInputProps) {
  const typedWord = useTypewriterPlaceholder(placeholderWords);

  const showIntro = revealed && playIntro;

  // Safety net: if the caller navigates away *during* the animation (before
  // `onAnimationEnd` marks it played), mark it played anyway so it doesn't
  // replay on return. Only do this if the animation was actually on screen
  // (`showIntro`): on the very first mount `revealed` is still `false`, so a
  // dev-mode StrictMode mount->unmount->remount triggers nothing here, and
  // the intro plays normally afterwards.
  const introEndRef = useRef({ showIntro, onIntroPlayed });
  introEndRef.current = { showIntro, onIntroPlayed };
  useEffect(() => {
    // Cleanup on real unmount only (empty deps). Reads *current* state via
    // the ref on purpose — we want to know whether the animation was on
    // screen at the moment the caller navigated away.
    return () => {
      const { showIntro: wasShowing, onIntroPlayed: done } = introEndRef.current;
      if (wasShowing) done();
    };
  }, []);

  return (
    <div
      className={cn(
        "relative w-full max-w-2xl rounded-lg border border-border bg-surface shadow-float transition-shadow duration-200 focus-within:border-accent focus-within:shadow-[0_0_0_4px_var(--color-accent-muted)]",
        !revealed ? "invisible" : showIntro ? "animate-reveal-mask" : "",
        className,
      )}
      style={showIntro ? { animationDuration: `${revealDurationMs}ms` } : undefined}
      onAnimationEnd={showIntro ? onIntroPlayed : undefined}
    >
      <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-xl text-text-muted">
        <Search className="h-5 w-5" />
      </span>
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        placeholder={placeholderPrefix + typedWord}
        className="optical-center-text w-full rounded-lg bg-transparent py-5 pl-14 pr-5 text-xl text-text outline-none placeholder:text-text-muted"
      />
    </div>
  );
}
