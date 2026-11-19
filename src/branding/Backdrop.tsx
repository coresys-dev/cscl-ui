import type { CSSProperties } from "react";
import { cn } from "../lib/cn";
import { AMBIENT_STRENGTH, ambientContours, ambientMix, ambientWaves, type AmbientStrength } from "../lib/ambient";

export type BackdropVariant = "dots" | "grid" | "glow" | "beam" | "orbits" | "contours" | "waves" | "grain";
export type BackdropFade = "center" | "top" | "bottom" | "edges" | "none";

export interface BackdropProps {
  /** The motif. */
  variant: BackdropVariant;
  /** `neutral` draws in the text colour, `accent` in the app's accent. Ignored when `color` is set. */
  tone?: "neutral" | "accent";
  /** Any CSS colour, for a texture tinted by something else than the accent (a product colour on a web page). */
  color?: string;
  /** How the texture fades out: towards the edges of a radial (`center`, `top`, `bottom`), into the sections above and below (`edges`), or not at all. */
  fade?: BackdropFade;
  /** Opacity multiplier: ×0.6, ×1 or ×1.5. */
  strength?: AmbientStrength;
  /** `false` keeps the texture still. Motion also stops under `prefers-reduced-motion`. */
  animated?: boolean;
  /** Pins the layer to the viewport instead of the parent (a page-wide grain). */
  fixed?: boolean;
  className?: string;
}

const MASK: Record<BackdropFade, string> = {
  center: "radial-gradient(ellipse 70% 70% at 50% 50%, #000 25%, transparent 78%)",
  top: "radial-gradient(ellipse 85% 80% at 50% 0%, #000 20%, transparent 80%)",
  bottom: "radial-gradient(ellipse 85% 80% at 50% 100%, #000 20%, transparent 80%)",
  edges: "linear-gradient(to bottom, transparent, #000 22%, #000 78%, transparent)",
  none: "none",
};

const ORBIT_RADII = [110, 190, 270, 350, 430, 510, 590];
const SVG = "absolute inset-0 h-full w-full";
const ORBIT_ORIGIN: CSSProperties = { transformOrigin: "500px 500px" };

/** CoreSys Backdrop: a quiet, slowly moving texture behind a section, so a black
 * canvas never reads flat. Decorative only (`aria-hidden`, no pointer events).
 *
 * It fills its nearest positioned ancestor from underneath (`-z-10`): give the
 * section `relative isolate`. Stack two for a richer spot (a glow under orbits).
 * Colour comes from the theme, so it follows the accent and the light theme.
 * Sized for sections: the SVG motifs scale with the area, but their fine lines
 * stay 1px wide at any size. */
export function Backdrop({ variant, tone = "neutral", color, fade = "center", strength = "normal", animated = true, fixed = false, className }: BackdropProps) {
  const mix = (percent: number) => ambientMix(percent, strength);
  const mask = MASK[fade];
  const rootStyle = {
    "--ambient-color": color ?? (tone === "accent" ? "var(--color-accent)" : "var(--color-text)"),
    WebkitMaskImage: mask,
    maskImage: mask,
  } as CSSProperties;

  return (
    <div
      aria-hidden
      data-ambient={animated ? "" : "static"}
      className={cn("pointer-events-none inset-0 -z-10 overflow-hidden", fixed ? "fixed" : "absolute", className)}
      style={rootStyle}
    >
      {variant === "dots" && (
        <>
          <div
            className="absolute inset-0"
            style={{ backgroundImage: `radial-gradient(${mix(15)} 1px, transparent 1.6px)`, backgroundSize: "24px 24px", backgroundPosition: "center" }}
          />
          {/* A spotlight wanders across and brightens the dots it passes. */}
          <div
            className="ambient-spotlight absolute inset-0 animate-ambient-wander"
            style={{ backgroundImage: `radial-gradient(${mix(40)} 1.1px, transparent 1.7px)`, backgroundSize: "24px 24px", backgroundPosition: "center" }}
          />
        </>
      )}

      {variant === "grid" && (
        <>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(${mix(6)} 1px, transparent 1px), linear-gradient(90deg, ${mix(6)} 1px, transparent 1px)`,
              backgroundSize: "64px 64px",
              backgroundPosition: "center",
            }}
          />
          {/* Every fourth crossing twinkles. */}
          <div
            className="absolute inset-0 animate-ambient-twinkle"
            style={{
              backgroundImage: `radial-gradient(${mix(16)} 1.2px, transparent 1.8px)`,
              backgroundSize: "256px 256px",
              backgroundPosition: "calc(50% - 0.5px) calc(50% - 0.5px)",
            }}
          />
          <div
            className="ambient-spotlight absolute inset-0 animate-ambient-wander"
            style={{
              backgroundImage: `linear-gradient(${mix(16)} 1px, transparent 1px), linear-gradient(90deg, ${mix(16)} 1px, transparent 1px)`,
              backgroundSize: "64px 64px",
              backgroundPosition: "center",
            }}
          />
        </>
      )}

      {variant === "glow" && (
        <>
          {/* Starts below the top edge, so a section border never cuts it. */}
          <div
            className="absolute left-1/2 top-6 h-[640px] w-[1100px] -translate-x-1/2 animate-ambient-drift"
            style={{ background: `radial-gradient(closest-side, ${mix(11)}, transparent)` }}
          />
          <div
            className="absolute left-[62%] top-[30%] h-[420px] w-[620px] -translate-x-1/2 animate-ambient-breathe"
            style={{ background: `radial-gradient(closest-side, ${mix(6)}, transparent)` }}
          />
        </>
      )}

      {variant === "beam" && (
        <>
          <div
            className="absolute inset-0 animate-ambient-sway"
            style={{
              transformOrigin: "50% -8%",
              background: `conic-gradient(from 0deg at 50% -8%, transparent 0deg 162deg, ${mix(7)} 180deg, transparent 198deg 360deg)`,
            }}
          />
          <div
            className="absolute left-1/2 top-4 h-[440px] w-[760px] -translate-x-1/2"
            style={{ background: `radial-gradient(closest-side, ${mix(11)}, transparent)` }}
          />
          <div className="absolute left-1/2 top-0 h-[70%] w-px" style={{ background: `linear-gradient(${mix(16)}, transparent)` }} />
          {/* A drop of light runs down the beam's axis. */}
          <div
            className="absolute left-1/2 top-0 h-[70%] w-px animate-ambient-drop"
            style={{ backgroundImage: `linear-gradient(transparent, ${mix(38)}, transparent)`, backgroundRepeat: "no-repeat", backgroundSize: "100% 36%" }}
          />
        </>
      )}

      {variant === "orbits" && (
        <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" fill="none" className={SVG}>
          {ORBIT_RADII.map((r) => (
            <circle key={r} cx="500" cy="500" r={r} vectorEffect="non-scaling-stroke" style={{ stroke: mix(6) }} />
          ))}
          <circle cx="500" cy="500" r="350" strokeDasharray="2 14" className="animate-ambient-spin" style={{ ...ORBIT_ORIGIN, stroke: mix(16) }} />
          <circle
            cx="500"
            cy="500"
            r="270"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="120 1600"
            className="animate-ambient-spin-fast"
            style={{ ...ORBIT_ORIGIN, stroke: mix(38) }}
          />
          <circle
            cx="500"
            cy="500"
            r="510"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="80 3150"
            className="animate-ambient-spin"
            style={{ ...ORBIT_ORIGIN, stroke: mix(38) }}
          />
        </svg>
      )}

      {variant === "contours" && <Contours mix={mix} />}

      {variant === "waves" && <Waves mix={mix} />}

      {variant === "grain" && <div className="ambient-grain absolute inset-0 animate-ambient-grain" style={{ opacity: 0.1 * AMBIENT_STRENGTH[strength] }} />}
    </div>
  );
}

function Contours({ mix }: { mix: (percent: number) => string }) {
  const { lines, highlights } = ambientContours();
  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none" className={SVG}>
      <g className="animate-ambient-float">
        <path d={lines} vectorEffect="non-scaling-stroke" style={{ stroke: mix(6) }} />
        <path d={highlights[0]} vectorEffect="non-scaling-stroke" style={{ stroke: mix(16) }} />
        <path d={highlights[1]} vectorEffect="non-scaling-stroke" style={{ stroke: mix(16) }} />
        {/* Two lights travel the highlighted contours, in opposite directions. */}
        <path
          d={highlights[0]}
          pathLength={1000}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="90 910"
          className="animate-ambient-run"
          style={{ stroke: mix(38) }}
        />
        <path
          d={highlights[1]}
          pathLength={1000}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="70 930"
          className="animate-ambient-run-slow"
          style={{ stroke: mix(38) }}
        />
      </g>
    </svg>
  );
}

function Waves({ mix }: { mix: (percent: number) => string }) {
  const { lines, highlight } = ambientWaves();
  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none" className={SVG}>
      <g className="animate-ambient-float">
        <path d={lines} vectorEffect="non-scaling-stroke" style={{ stroke: mix(6) }} />
        <path d={highlight} strokeWidth="1.5" vectorEffect="non-scaling-stroke" style={{ stroke: mix(16) }} />
        {/* A pulse runs along the centre line, like a playhead. */}
        <path
          d={highlight}
          pathLength={1000}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="140 860"
          className="animate-ambient-run-fast"
          style={{ stroke: mix(38) }}
        />
      </g>
    </svg>
  );
}
