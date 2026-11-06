import { useEffect, useMemo, useRef } from "react";
import { buildWaveformPath } from "../lib/waveformPath";
import { cn } from "../lib/cn";

export interface WaveformProps {
  /** Flattened `[min, max]` pairs in `[-1, 1]`, one pair per bucket. */
  peaks: number[];
  /** The playback position as a fraction 0..1, read every frame (e.g. `() => audio.currentTime / audio.duration`). */
  getFraction: () => number;
  onSeek: (fraction: number) => void;
  /** An In/Out zone as fractions 0..1, tinted with the accent. */
  range?: { start: number; end: number } | null;
  className?: string;
}

/** Interactive waveform: the path is built once from `peaks` (static SVG),
 * while the playhead moves through `transform` outside React on an animation
 * frame loop: no re-render at playback rate. Click anywhere to seek. */
export function Waveform({ peaks, getFraction, onSeek, range, className }: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const read = useRef(getFraction);
  read.current = getFraction;
  const resolution = peaks.length / 2;
  const pathD = useMemo(() => buildWaveformPath(peaks), [peaks]);

  useEffect(() => {
    let frame: number;
    const tick = () => {
      const container = containerRef.current;
      const playhead = playheadRef.current;
      if (container && playhead) {
        const f = read.current();
        playhead.style.transform = `translateX(${(Number.isFinite(f) ? Math.min(1, Math.max(0, f)) : 0) * container.clientWidth}px)`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      ref={containerRef}
      onClick={(e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect && rect.width > 0) onSeek(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)));
      }}
      className={cn("relative h-20 w-full cursor-pointer select-none", className)}
    >
      <svg viewBox={`0 0 ${resolution} 100`} preserveAspectRatio="none" className="h-full w-full text-accent">
        <path d={pathD} stroke="currentColor" strokeWidth={1} fill="none" vectorEffect="non-scaling-stroke" />
      </svg>
      {range && (
        <div
          className="pointer-events-none absolute top-0 h-full bg-accent/20"
          style={{ left: `${range.start * 100}%`, width: `${(range.end - range.start) * 100}%` }}
        />
      )}
      <div ref={playheadRef} className="pointer-events-none absolute left-0 top-0 h-full w-px bg-text" />
    </div>
  );
}
