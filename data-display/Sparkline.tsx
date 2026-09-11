import { useMemo } from "react";
import { buildWaveformPath } from "../lib/waveformPath";

interface SparklineProps {
  /** Flattened `[min, max]` pairs in `[-1, 1]`, one pair per bucket. `undefined`
   * while peaks haven't loaded yet — renders an empty placeholder of the same
   * size instead of nothing, so surrounding rows don't reflow when it arrives. */
  peaks: number[] | undefined;
}

/** Small static, non-interactive waveform preview for a list row — no
 * playhead, just a quick visual fingerprint of the audio content. For the
 * full interactive waveform (playhead, seek), see `Waveform`. */
export function Sparkline({ peaks }: SparklineProps) {
  const resolution = peaks ? peaks.length / 2 : 0;
  const pathD = useMemo(() => (peaks ? buildWaveformPath(peaks) : ""), [peaks]);

  if (!peaks) {
    return <div className="h-6 w-24 shrink-0" aria-hidden />;
  }

  return (
    <svg
      viewBox={`0 0 ${resolution} 100`}
      preserveAspectRatio="none"
      className="h-6 w-24 shrink-0 text-text-muted"
      aria-hidden
    >
      <path d={pathD} stroke="currentColor" strokeWidth={2} fill="none" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
