import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from "react";
import { Maximize2, Minimize2, Pause, Play } from "lucide-react";
import { cn } from "../lib/cn";
import { forwardRate, formatTimecode, nextRate, playbackState, safeFps, STALLED_TIMEOUT_MS, type PlaybackState } from "../lib/media";
import { Button } from "../primitives/Button";
import { IconButton } from "../primitives/IconButton";
import { Timeline, type TimelineMarker } from "./Timeline";

export interface VideoStageHandle {
  seek: (seconds: number) => void;
  togglePlay: () => void;
  pause: () => void;
  /** J: one second back (HTML video can't play backwards reliably). */
  back: () => void;
  /** L: plays forward; each further press steps the speed up to 2×. */
  forward: () => void;
  /** One frame (or one second with `seconds`) back or forward. */
  step: (direction: -1 | 1, seconds: boolean) => void;
  currentTime: () => number;
}

export interface VideoStageLabels {
  play: string;
  pause: string;
  timeline: string;
  speed: (rate: string) => string;
  fullscreen: string;
  exitFullscreen: string;
  loading: string;
}

export interface VideoStageProps {
  /** `null` when the file isn't available here: `unsupported` shows instead. */
  src: string | null;
  /** Measured frame rate; 0 or unknown steps at 25. */
  fps?: number;
  /** Known duration in seconds, used until the metadata arrives. */
  duration?: number | null;
  markers?: TimelineMarker[];
  activeMarkerId?: string | null;
  onMarker?: (id: string) => void;
  /** A pending In/Out range in seconds. */
  range?: { start: number; end: number | null } | null;
  fullscreen?: boolean;
  onFullscreen?: () => void;
  /** Coarse (a few times a second, and on every seek). */
  onTime?: (seconds: number) => void;
  onStateChange?: (state: PlaybackState) => void;
  /** What to show for a file the webview can't read or that isn't here (with an "Open in…" action). */
  unsupported?: ReactNode;
  labels?: Partial<VideoStageLabels>;
}

const DEFAULT_LABELS: VideoStageLabels = {
  play: "Play",
  pause: "Pause",
  timeline: "Timeline",
  speed: (r) => `Speed ${r}`,
  fullscreen: "Full screen",
  exitFullscreen: "Exit full screen",
  loading: "Loading…",
};

const rateLabel = (rate: number) => `${rate}×`;

/** A review-grade video player: frame-accurate timecode, J/K/L and frame
 * stepping through its handle (wire your own keys), speed, full screen, an
 * In/Out range and markers on a scrubbable timeline. Files the webview can't
 * decode (ProRes, some HEVC) fall back to `unsupported` after a timeout. */
export const VideoStage = forwardRef<VideoStageHandle, VideoStageProps>(function VideoStage(
  { src, fps = 0, duration: knownDuration, markers, activeMarkerId, onMarker, range, fullscreen, onFullscreen, onTime, onStateChange, unsupported, labels },
  ref,
) {
  const l = { ...DEFAULT_LABELS, ...labels };
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<PlaybackState>(src ? "loading" : "unsupported");
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(knownDuration ?? 0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const rateFps = safeFps(fps);

  useEffect(() => onStateChange?.(state), [state, onStateChange]);

  // One timeout per file; metadata arriving late still wins.
  useEffect(() => {
    setState(src ? "loading" : "unsupported");
    if (!src) return;
    const id = window.setTimeout(() => setState((s) => playbackState("stalled-timeout", s)), STALLED_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [src]);

  // Frame-accurate timecode while playing; timeupdate alone ticks about four times a second.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      if (video.current) setTime(video.current.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const seek = useCallback(
    (to: number) => {
      const el = video.current;
      if (!el) return;
      const end = Number.isFinite(el.duration) ? el.duration : duration;
      el.currentTime = Math.max(0, end ? Math.min(to, end) : to);
      setTime(el.currentTime);
    },
    [duration],
  );
  const pause = useCallback(() => video.current?.pause(), []);
  const ready = state === "ready";
  const play = () => void video.current?.play().catch(() => undefined);

  useImperativeHandle(
    ref,
    () => ({
      seek,
      pause,
      togglePlay: () => {
        const el = video.current;
        if (el && ready) void (el.paused ? el.play().catch(() => undefined) : el.pause());
      },
      back: () => {
        const el = video.current;
        if (!el || !ready) return;
        el.pause();
        seek(el.currentTime - 1);
      },
      forward: () => {
        const el = video.current;
        if (!el || !ready) return;
        el.playbackRate = forwardRate(!el.paused, el.playbackRate);
        void el.play().catch(() => undefined);
      },
      step: (direction, seconds) => {
        const el = video.current;
        if (!el || !ready) return;
        el.pause();
        if (seconds) return seek(el.currentTime + direction);
        // Land just inside the next frame, so the picture and the timecode agree.
        seek((Math.round(el.currentTime * rateFps) + direction) / rateFps + 0.001);
      },
      currentTime: () => video.current?.currentTime ?? 0,
    }),
    [seek, pause, ready, rateFps],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg bg-black">
        {src && (
          <video
            ref={video}
            src={src}
            preload="metadata"
            playsInline
            onClick={() => ready && (video.current?.paused ? play() : pause())}
            onDoubleClick={onFullscreen}
            onLoadedMetadata={(e) => {
              const el = e.currentTarget;
              if (Number.isFinite(el.duration)) setDuration(el.duration);
              // Some webviews read the container of a file they can't decode and give it no picture.
              setState((s) => playbackState(el.videoWidth > 0 ? "loadedmetadata" : "error", s));
            }}
            onError={() => setState((s) => playbackState("error", s))}
            onPlay={() => setPlaying(true)}
            onPause={(e) => {
              setPlaying(false);
              setTime(e.currentTarget.currentTime);
              onTime?.(e.currentTarget.currentTime);
            }}
            onEnded={() => setPlaying(false)}
            onTimeUpdate={(e) => {
              if (!playing) setTime(e.currentTarget.currentTime);
              onTime?.(e.currentTarget.currentTime);
            }}
            onSeeked={(e) => onTime?.(e.currentTarget.currentTime)}
            onRateChange={(e) => setRate(e.currentTarget.playbackRate)}
            className={cn("h-full w-full object-contain", !ready && "invisible")}
          />
        )}
        {state === "unsupported" && <div className="absolute inset-0">{unsupported}</div>}
        {state === "loading" && <p className="absolute inset-0 flex items-center justify-center text-sm text-text-muted">{l.loading}</p>}
      </div>

      {ready && (
        <div className="flex flex-col gap-1 pt-2">
          <Timeline
            time={time}
            duration={duration}
            onSeek={seek}
            range={range}
            markers={markers}
            activeMarkerId={activeMarkerId}
            onMarker={onMarker}
            label={l.timeline}
            formatTime={(s) => formatTimecode(s, rateFps)}
          />
          <div className="flex items-center gap-2">
            <IconButton aria-label={playing ? l.pause : l.play} onClick={() => (playing ? pause() : play())}>
              {playing ? <Pause /> : <Play />}
            </IconButton>
            <span className="font-mono text-xs tabular-nums text-text">{formatTimecode(time, rateFps)}</span>
            <span className="font-mono text-xs tabular-nums text-text-muted">/ {formatTimecode(duration, rateFps)}</span>
            <span className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              aria-label={l.speed(rateLabel(rate))}
              title={l.speed(rateLabel(rate))}
              onClick={() => {
                if (video.current) video.current.playbackRate = nextRate(rate);
              }}
              className="w-14 tabular-nums"
            >
              {rateLabel(rate)}
            </Button>
            {onFullscreen && (
              <IconButton aria-label={fullscreen ? l.exitFullscreen : l.fullscreen} onClick={onFullscreen}>
                {fullscreen ? <Minimize2 /> : <Maximize2 />}
              </IconButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
