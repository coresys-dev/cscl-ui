import { useEffect, useMemo, useRef } from "react";
import { buildWaveformPath } from "../lib/waveformPath";

interface WaveformProps {
  /** Flattened `[min, max]` pairs in `[-1, 1]`, one pair per bucket. */
  peaks: number[];
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onSeek: (fraction: number) => void;
}

/** Interactive waveform: the path is built once from `peaks` (static SVG,
 * never re-rendered), while the playhead is moved via `transform` outside of
 * React on a `requestAnimationFrame` loop reading `audioRef.current.currentTime`
 * directly — this avoids a React re-render at playback frame rate. Click
 * anywhere on it to seek. */
export function Waveform({ peaks, audioRef, onSeek }: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const resolution = peaks.length / 2;
  const pathD = useMemo(() => buildWaveformPath(peaks), [peaks]);

  useEffect(() => {
    let frame: number;
    const tick = () => {
      const audio = audioRef.current;
      const container = containerRef.current;
      const playhead = playheadRef.current;
      if (audio && container && playhead && audio.duration > 0) {
        const fraction = audio.currentTime / audio.duration;
        playhead.style.transform = `translateX(${fraction * container.clientWidth}px)`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [audioRef]);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    onSeek(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)));
  }

  return (
    <div ref={containerRef} onClick={handleClick} className="relative h-20 w-full cursor-pointer select-none">
      <svg viewBox={`0 0 ${resolution} 100`} preserveAspectRatio="none" className="h-full w-full text-accent">
        <path d={pathD} stroke="currentColor" strokeWidth={1} fill="none" vectorEffect="non-scaling-stroke" />
      </svg>
      <div ref={playheadRef} className="pointer-events-none absolute left-0 top-0 h-full w-px bg-white/90" />
    </div>
  );
}
