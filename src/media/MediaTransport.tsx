import type { ReactNode } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "../lib/cn";
import { Slider } from "../primitives/Slider";

export interface MediaTransportLabels {
  play: string;
  pause: string;
  volume: string;
}

export interface MediaTransportProps {
  playing: boolean;
  onToggle: () => void;
  /** The file's name. */
  title?: ReactNode;
  /** Small facts after the title: format, sample rate, size, tags. */
  meta?: ReactNode;
  /** The middle: a `Waveform`, a `Timeline`, or a loading / error line. */
  children: ReactNode;
  /** Already formatted, shown on the right ("2:14", "2:14 / 3:05"). */
  time?: ReactNode;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
  /** Shown instead of everything while nothing is loaded ("Pick a sound to play it"). */
  empty?: ReactNode;
  labels?: Partial<MediaTransportLabels>;
  className?: string;
}

const DEFAULT_LABELS: MediaTransportLabels = { play: "Play", pause: "Pause", volume: "Volume" };

/** The floating player bar: a large round play button (the one control that
 * outranks the icon-button scale), the file's name and facts over a waveform or
 * a timeline, the time and the volume. Bring your own media element. */
export function MediaTransport({ playing, onToggle, title, meta, children, time, volume, onVolumeChange, empty, labels, className }: MediaTransportProps) {
  const l = { ...DEFAULT_LABELS, ...labels };
  if (empty)
    return (
      <div
        className={cn(
          "flex h-20 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-sm text-text-muted shadow-float",
          className,
        )}
      >
        {empty}
      </div>
    );
  return (
    <div className={cn("flex shrink-0 items-stretch gap-3 rounded-lg border border-border bg-surface p-3 shadow-float sm:gap-4 sm:px-4", className)}>
      <button
        type="button"
        onClick={onToggle}
        aria-label={playing ? l.pause : l.play}
        aria-pressed={playing}
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center self-center rounded-full border transition-all duration-200 active:scale-90",
          playing ? "border-accent text-accent shadow-[0_0_16px_-3px_var(--color-accent)]" : "border-border text-text hover:border-accent hover:text-accent",
        )}
      >
        {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </button>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        {(title || meta) && (
          <div className="flex min-w-0 items-center gap-2 text-sm">
            {title && <span className="min-w-[6rem] shrink truncate font-medium text-text">{title}</span>}
            {meta && <span className="flex min-w-0 items-center gap-2 text-xs text-text-muted">{meta}</span>}
          </div>
        )}
        {children}
      </div>
      {(time !== undefined || onVolumeChange) && (
        <div className="flex shrink-0 flex-col items-end justify-center gap-1.5 self-center text-right text-xs tabular-nums text-text-muted">
          {time}
          {onVolumeChange && volume !== undefined && (
            <div className="hidden w-28 sm:block">
              <Slider value={volume} onChange={onVolumeChange} ariaLabel={l.volume} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
