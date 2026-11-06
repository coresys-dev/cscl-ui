import type { PointerEvent } from "react";
import { cn } from "../lib/cn";
import { Tooltip } from "../overlays/Tooltip";

export interface TimelineMarker {
  id: string;
  /** Seconds. */
  start: number;
  /** Seconds; a marker with an end draws a span. */
  end?: number | null;
  /** Shown on hover (a comment's first words). */
  label: string;
  /** Muted once handled (a resolved comment). */
  done?: boolean;
}

export interface TimelineProps {
  /** Seconds. */
  time: number;
  duration: number;
  onSeek: (seconds: number) => void;
  /** A pending In/Out range in seconds; `end: null` while only In is set. */
  range?: { start: number; end: number | null } | null;
  markers?: TimelineMarker[];
  activeMarkerId?: string | null;
  onMarker?: (id: string) => void;
  /** Accessible name and value text. */
  label?: string;
  formatTime?: (seconds: number) => string;
  className?: string;
}

/** A scrubbable timeline: drag anywhere to seek, an In/Out range tinted with
 * the accent, and markers (points or spans) that jump to their moment. An ARIA
 * slider for assistive tech. */
export function Timeline({ time, duration, onSeek, range, markers = [], activeMarkerId, onMarker, label = "Timeline", formatTime, className }: TimelineProps) {
  const pct = (s: number) => `${duration > 0 ? Math.min(100, Math.max(0, (s / duration) * 100)) : 0}%`;
  const scrub = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (duration > 0) onSeek(Math.min(duration, Math.max(0, ((e.clientX - r.left) / r.width) * duration)));
  };
  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(time)}
      aria-valuetext={formatTime?.(time)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          onSeek(Math.min(duration, Math.max(0, time + (e.key === "ArrowRight" ? 1 : -1) * (e.shiftKey ? 10 : 1))));
        }
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        scrub(e);
      }}
      onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && scrub(e)}
      className={cn("relative h-7 rounded-sm", className)}
    >
      <div className="absolute inset-x-0 bottom-2 h-1 rounded-full bg-border">
        <div className="h-full rounded-full bg-text-muted" style={{ width: pct(time) }} />
      </div>
      {range && (
        <div
          className="absolute bottom-2 h-1 rounded-full bg-accent/50"
          style={{ left: pct(range.start), width: range.end != null ? `calc(${pct(range.end)} - ${pct(range.start)})` : 2 }}
        />
      )}
      <div className="pointer-events-none absolute bottom-1 h-3 w-0.5 -translate-x-1/2 rounded-full bg-text" style={{ left: pct(time) }} />
      {markers.map((m) => {
        const span = m.end != null && m.end > m.start;
        return (
          <div
            key={m.id}
            className={cn("absolute top-0", !span && "-translate-x-1/2")}
            style={{ left: pct(m.start), width: span ? `calc(${pct(m.end!)} - ${pct(m.start)})` : undefined }}
          >
            <Tooltip label={m.label.length > 80 ? `${m.label.slice(0, 79)}…` : m.label}>
              <button
                type="button"
                tabIndex={-1}
                aria-label={formatTime ? `${m.label} (${formatTime(m.start)})` : m.label}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => (onMarker ? onMarker(m.id) : onSeek(m.start))}
                className={cn(
                  "block h-2 rounded-full transition-transform duration-150 hover:scale-y-150",
                  span ? "w-full min-w-2" : "w-2",
                  m.done ? "bg-text-muted" : "bg-accent",
                  m.id === activeMarkerId && "ring-2 ring-text",
                )}
              />
            </Tooltip>
          </div>
        );
      })}
    </div>
  );
}
