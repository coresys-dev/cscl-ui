const VIEWBOX_HEIGHT = 100;

function clamp(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

function toY(value: number): number {
  return VIEWBOX_HEIGHT / 2 - clamp(value) * (VIEWBOX_HEIGHT / 2);
}

/** Builds a static SVG path (one min/max bar per bucket) from a persisted
 * `peaks` array (pairs of `[min, max]` values in `[-1, 1]`, flattened). Shared
 * by `Sparkline` and `Waveform`. */
export function buildWaveformPath(peaks: number[]): string {
  const resolution = peaks.length / 2;
  let d = "";
  for (let i = 0; i < resolution; i++) {
    const yMin = toY(peaks[i * 2]);
    const yMax = toY(peaks[i * 2 + 1]);
    d += `M${i} ${yMin.toFixed(1)} L${i} ${yMax.toFixed(1)} `;
  }
  return d;
}
