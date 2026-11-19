/* Geometry and colour helpers for `Backdrop` (branding/Backdrop.tsx).
 * Pure and deterministic: the same call always returns the same paths, so
 * server and client renders match. Paths are drawn in a 1440×900 viewBox and
 * cached after the first call. */

export type AmbientStrength = "soft" | "normal" | "strong";

/** Opacity multiplier per strength. */
export const AMBIENT_STRENGTH: Record<AmbientStrength, number> = { soft: 0.6, normal: 1, strong: 1.5 };

/** `color-mix()` of the backdrop colour (`--ambient-color`) at `percent`, scaled by `strength`, capped at 100%. */
export function ambientMix(percent: number, strength: AmbientStrength = "normal"): string {
  const p = Math.min(100, Math.max(0, percent * AMBIENT_STRENGTH[strength]));
  return `color-mix(in srgb, var(--ambient-color) ${Number(p.toFixed(2))}%, transparent)`;
}

const fmt = (n: number) => n.toFixed(1);

export interface ContourPaths {
  /** Every contour line except the two highlighted ones, as one path. */
  lines: string;
  /** Two single closed contours that carry the travelling lights. */
  highlights: [string, string];
}

/** Summits: centre x, centre y, scale, phase. */
const SUMMITS: [number, number, number, number][] = [
  [250, 210, 1, 0.3],
  [1190, 700, 1.25, 1.7],
  [880, 120, 0.7, 3.1],
];
const RINGS_PER_SUMMIT = 9;
const CONTOUR_STEPS = 96;

let contourCache: ContourPaths | null = null;

/** Topographic contour lines around three summits. */
export function ambientContours(): ContourPaths {
  if (contourCache) return contourCache;
  let lines = "";
  let first = "";
  let second = "";
  SUMMITS.forEach(([cx, cy, scale, phase], summit) => {
    for (let k = 1; k <= RINGS_PER_SUMMIT; k++) {
      const base = (34 + k * 44) * scale;
      let d = "";
      for (let i = 0; i <= CONTOUR_STEPS; i++) {
        const a = (i / CONTOUR_STEPS) * Math.PI * 2;
        const r = base * (1 + 0.11 * Math.sin(3 * a + k * 0.45 + phase) + 0.05 * Math.sin(7 * a - k * 0.3 + phase) + 0.03 * Math.cos(11 * a + k));
        d += `${i ? "L" : "M"}${fmt(cx + Math.cos(a) * r * 1.15)} ${fmt(cy + Math.sin(a) * r)} `;
      }
      d += "Z ";
      if (summit === 1 && k === 5) first = d;
      else if (summit === 0 && k === 4) second = d;
      else lines += d;
    }
  });
  contourCache = { lines: lines.trim(), highlights: [first.trim(), second.trim()] };
  return contourCache;
}

export interface WavePaths {
  /** Every wave line except the centre one, as one path. */
  lines: string;
  /** The centre line, which carries the playhead pulse. */
  highlight: string;
}

const WAVE_COUNT = 17;
const WAVE_CENTRE = 8;

let waveCache: WavePaths | null = null;

/** Horizontal wave lines, louder in the middle like an audio envelope. */
export function ambientWaves(): WavePaths {
  if (waveCache) return waveCache;
  let lines = "";
  let highlight = "";
  for (let i = 0; i < WAVE_COUNT; i++) {
    const y0 = 110 + i * 42;
    const amp = 6 + 26 * Math.exp(-(((i - WAVE_CENTRE) / 3.6) ** 2));
    const freq = 0.011 + (i % 4) * 0.0024;
    const phase = i * 0.9;
    let d = "";
    for (let x = -20, j = 0; x <= 1460; x += 10, j++) {
      const envelope = 0.18 + 0.82 * Math.exp(-(((x - 720) / 430) ** 2));
      const y = y0 + amp * envelope * (Math.sin(x * freq + phase) * 0.75 + Math.sin(x * freq * 2.7 + phase * 1.3) * 0.25);
      d += `${j ? "L" : "M"}${x} ${fmt(y)} `;
    }
    if (i === WAVE_CENTRE) highlight = d.trim();
    else lines += d;
  }
  waveCache = { lines: lines.trim(), highlight };
  return waveCache;
}
