import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";

type Phase = "rolling" | "sliding" | "fading" | "hidden";

/** Sub-phase handed to the `children` render prop: `"rolling"` while the
 * identity mark should still be looping (splash centered on screen),
 * `"settled"` from the moment the slide-into-place starts through to the
 * crossfade. Lets the caller swap to a frozen/single-frame rendering of its
 * own ticker for `"settled"` without this component needing to know
 * anything about *how* that ticker animates internally. */
export type BootTransitionContentPhase = "rolling" | "settled";

export interface BootTransitionSplashProps {
  /** `true` once initial data is ready. The rolling phase never ends before
   * at least one full `rollCycleMs` has elapsed, even if this is already
   * `true` — the user always sees at least one full loop. */
  ready: boolean;
  /** The real, already-mounted identity element (e.g. a `WordTicker`) that
   * this splash's own copy should land on — measured via
   * `getBoundingClientRect()` for the FLIP slide. Typically the same ref
   * forwarded into that element elsewhere in the app's persistent chrome. */
  targetRef: RefObject<HTMLDivElement | null>;
  /** Called at the start of the fade-out: the signal for the caller to
   * mount the rest of the app's shell (still empty) exactly under the
   * ticker completing its slide. */
  onCrossfadeStart: () => void;
  /** Called once the splash is fully gone: the signal to start the app's
   * own element-by-element entrance for its remaining content. */
  onFinished: () => void;
  /** Render prop for the identity content itself (a ticker, a logo mark —
   * whatever the app's `targetRef`'d element is), given the current
   * sub-phase so it can render a looping vs. a frozen single frame. Takes
   * the place of SLDR's hardcoded `SloganTicker`. */
  children: (phase: BootTransitionContentPhase) => ReactNode;
  /** Minimum duration of one roll cycle, in ms, before the slide can start
   * (once `ready`). Should match whatever loop duration `children` itself
   * uses for the `"rolling"` phase, so the release always lands on a visual
   * cycle boundary. Default matches SLDR's original splash. */
  rollCycleMs?: number;
  /** Duration of the FLIP slide-into-place transform, in ms. Default matches
   * SLDR's original splash. */
  slideMs?: number;
  /** Duration of the final opacity crossfade, in ms. Default matches SLDR's
   * original splash. */
  fadeMs?: number;
}

/** Boot splash: the app's rolling identity mark, centered full-screen, loops
 * until data is ready, then slides (measured FLIP transform, not a fixed
 * offset) into its real resting place in the app's persistent chrome before
 * yielding to it — which then builds in the rest of its content
 * element-by-element (see the CoreSys design system artifact, "Startup sequence"). */
export function BootTransitionSplash({
  ready,
  targetRef,
  onCrossfadeStart,
  onFinished,
  children,
  rollCycleMs = 5000,
  slideMs = 450,
  fadeMs = 200,
}: BootTransitionSplashProps) {
  const [phase, setPhase] = useState<Phase>("rolling");
  const overlayRef = useRef<HTMLDivElement>(null);
  const [slideTransform, setSlideTransform] = useState<string | undefined>(undefined);

  // "rolling": at least one full cycle, extended for as long as `ready` is
  // still false — always released on a cycle boundary (the content the
  // caller renders for "rolling" is assumed to be visually at rest there,
  // identical to its initial frame), so there's never a visual jump moving
  // into "sliding".
  useEffect(() => {
    if (phase !== "rolling") return;
    const id = window.setInterval(() => {
      if (ready) setPhase("sliding");
    }, rollCycleMs);
    return () => window.clearInterval(id);
  }, [phase, ready, rollCycleMs]);

  // "sliding": measure the splash's own current position against its real
  // target and animate a `translate` between the two (centers aligned,
  // indifferent to differing padding on either box).
  useEffect(() => {
    if (phase !== "sliding") return;
    const overlay = overlayRef.current;
    const target = targetRef.current;
    if (!overlay || !target) {
      setPhase("fading");
      return;
    }
    const from = overlay.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const frame = requestAnimationFrame(() => {
      setSlideTransform(`translate(${dx}px, ${dy}px)`);
    });
    const timer = window.setTimeout(() => setPhase("fading"), slideMs + 16);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [phase, targetRef, slideMs]);

  useEffect(() => {
    if (phase !== "fading") return;
    onCrossfadeStart();
    const timer = window.setTimeout(() => {
      setPhase("hidden");
      onFinished();
    }, fadeMs);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (phase === "hidden") return null;

  const tickerTransition = phase === "sliding" ? `transform ${slideMs}ms var(--ease-in-out-quart)` : undefined;
  const tickerStyle: CSSProperties = { transform: slideTransform, transition: tickerTransition };

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-bg"
      style={{ opacity: phase === "fading" ? 0 : 1, transition: `opacity ${fadeMs}ms var(--ease-in-out-quart)` }}
    >
      <div ref={overlayRef} style={tickerStyle}>
        {children(phase === "rolling" ? "rolling" : "settled")}
      </div>
    </div>
  );
}
