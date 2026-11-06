import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type DragEvent, type MouseEvent, type PointerEvent, type RefObject } from "react";
import { Plus } from "lucide-react";
import { cn } from "../lib/cn";
import { fromMinutes, layoutDay, timeSpan, weekDays, weekdayNames } from "../lib/calendar";
import { ScrollArea } from "../primitives/ScrollArea";

export interface CalendarEntry {
  id: string;
  /** Local ISO date. */
  date: string;
  /** "HH:MM"; absent or empty puts the entry in the all-day lane. */
  start?: string | null;
  /** "HH:MM"; absent or before `start` reads as one hour. */
  end?: string | null;
  title: string;
  /** A second line (people, place). */
  subtitle?: string;
  /** Any CSS colour: a tinted fill with a solid edge. Default: the accent. */
  color?: string;
  /** Fixed entries can't be dragged or resized. */
  locked?: boolean;
}

export interface WeekGridLabels {
  allDay: string;
  addOn: (iso: string) => string;
  untitled: string;
}

export interface WeekGridProps {
  /** Local ISO date of the first day (a Monday). */
  weekStart: string;
  entries: CalendarEntry[];
  /** Local ISO date of today. */
  today: string;
  /** Drag on empty time: a new entry from `start` to `end` ("HH:MM"); double-click in the all-day lane: `start` is null. */
  onCreate?: (date: string, start: string | null, end: string | null) => void;
  /** An entry dropped on a day: `start` is null in the all-day lane. */
  onMove?: (id: string, date: string, start: string | null) => void;
  onResize?: (id: string, end: string) => void;
  onOpen?: (id: string) => void;
  onEntryMenu?: (e: MouseEvent, id: string) => void;
  /** The "+" shown on a day's header (a menu: new event, new task…). */
  onDayAdd?: (e: MouseEvent, date: string) => void;
  locale?: string;
  labels?: Partial<WeekGridLabels>;
  className?: string;
}

const HOUR = 44;
const SNAP = 15;
const GRID = "grid grid-cols-[52px_repeat(7,minmax(0,1fr))]";
const DND = "application/x-cscl-calendar-entry";
// Where the pointer grabbed an entry, in minutes from its start: a drop keeps that point under the pointer.
let grabbed = 0;

const minutesAt = (el: HTMLElement, clientY: number) => {
  const m = ((clientY - el.getBoundingClientRect().top) / HOUR) * 60;
  return Math.max(0, Math.min(24 * 60 - SNAP, Math.round(m / SNAP) * SNAP));
};

const entryStyle = (color = "var(--color-accent)"): CSSProperties => ({
  background: `color-mix(in srgb, ${color} 18%, var(--color-surface))`,
  boxShadow: `inset 2px 0 0 ${color}`,
});

/** Seven days over the hours: all-day entries on top, timed ones on the grid.
 * Drag on empty time to create, drag an entry to move it (to another day, or
 * to the all-day lane), drag its bottom edge to resize. A red line marks now. */
export function WeekGrid({ weekStart, entries, today, onCreate, onMove, onResize, onOpen, onEntryMenu, onDayAdd, locale, labels, className }: WeekGridProps) {
  const l: WeekGridLabels = { allDay: "All day", addOn: (d) => `Add on ${d}`, untitled: "Untitled", ...labels };
  const days = weekDays(weekStart);
  const names = weekdayNames(locale, true, "short");
  const scroller = useRef<HTMLElement>(null);
  const gutter = useScrollbarWidth(scroller);

  // Opens on the working day, or earlier when the week has an earlier entry; only when the week changes.
  useLayoutEffect(() => {
    const starts = entries.map((e) => timeSpan(e.start, e.end)?.start ?? Infinity);
    const first = Math.min(8 * 60, ...starts);
    if (scroller.current) scroller.current.scrollTop = Math.max(0, (first / 60) * HOUR - 24);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  const shared = { l, onCreate, onMove, onResize, onOpen, onEntryMenu };
  return (
    <div className={cn("flex min-h-[460px] flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface", className)}>
      {/* The header rows leave room for the hour grid's scrollbar, so the columns line up. */}
      <div className={cn(GRID, "border-b border-border")} style={{ paddingRight: gutter }}>
        <div />
        {days.map((d, i) => (
          <div key={d} className="group flex items-center justify-between border-l border-border px-2 py-1.5">
            <span className="flex items-baseline gap-1.5">
              <span className="text-xs capitalize text-text-muted">{names[i]}</span>
              <span
                className={cn(
                  "flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-sm tabular-nums",
                  d === today ? "bg-accent text-bg" : "text-text",
                )}
              >
                {Number(d.slice(8))}
              </span>
            </span>
            {onDayAdd && (
              <button
                type="button"
                aria-label={l.addOn(d)}
                onClick={(e) => onDayAdd(e, d)}
                className="flex h-6 w-6 items-center justify-center rounded-sm text-text-muted opacity-0 transition-opacity hover:bg-surface-hover hover:text-text focus-visible:opacity-100 group-hover:opacity-100"
              >
                <Plus size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className={cn(GRID, "border-b border-border")} style={{ paddingRight: gutter }}>
        <div className="px-1.5 py-1.5 text-right text-[10px] leading-3 text-text-muted">{l.allDay}</div>
        {days.map((d) => (
          <AllDayCell key={d} date={d} entries={entries.filter((e) => e.date === d && !timeSpan(e.start, e.end))} {...shared} />
        ))}
      </div>
      <ScrollArea ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
        <div className={cn(GRID, "relative")} style={{ height: 24 * HOUR }}>
          <div className="relative">
            {Array.from({ length: 23 }, (_, h) => (
              <span key={h} className="absolute right-1.5 -translate-y-1/2 text-[10px] tabular-nums text-text-muted" style={{ top: (h + 1) * HOUR }}>
                {String(h + 1).padStart(2, "0")}:00
              </span>
            ))}
          </div>
          {days.map((d) => (
            <DayColumn key={d} date={d} isToday={d === today} entries={entries.filter((e) => e.date === d && timeSpan(e.start, e.end))} {...shared} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

interface Shared {
  l: WeekGridLabels;
  onCreate?: WeekGridProps["onCreate"];
  onMove?: WeekGridProps["onMove"];
  onResize?: WeekGridProps["onResize"];
  onOpen?: WeekGridProps["onOpen"];
  onEntryMenu?: WeekGridProps["onEntryMenu"];
}

function dragStart(e: DragEvent, entry: CalendarEntry, offset: number) {
  grabbed = offset;
  e.dataTransfer.setData(DND, entry.id);
  e.dataTransfer.effectAllowed = "move";
}

function useDrop(onDrop: (id: string, e: DragEvent) => void, onOver?: (e: DragEvent) => void) {
  const [over, setOver] = useState(false);
  return {
    over,
    props: {
      onDragOver: (e: DragEvent) => {
        if (![...e.dataTransfer.types].includes(DND)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!over) setOver(true);
        onOver?.(e);
      },
      onDragLeave: (e: DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false);
      },
      onDrop: (e: DragEvent) => {
        setOver(false);
        const id = e.dataTransfer.getData(DND);
        if (!id) return;
        e.preventDefault();
        onDrop(id, e);
      },
    },
  };
}

function AllDayCell({ date, entries, l, onCreate, onMove, onOpen, onEntryMenu }: Shared & { date: string; entries: CalendarEntry[] }) {
  const zone = useDrop((id) => onMove?.(id, date, null));
  return (
    <div
      {...(onMove ? zone.props : {})}
      onDoubleClick={(e) => e.target === e.currentTarget && onCreate?.(date, null, null)}
      className={cn(
        "no-scrollbar flex max-h-32 min-h-9 min-w-0 flex-col gap-1 overflow-y-auto border-l border-border p-1 transition-colors",
        zone.over && "bg-accent-muted/40",
      )}
    >
      {entries.map((e) => (
        <button
          key={e.id}
          type="button"
          draggable={!!onMove && !e.locked}
          onDragStart={(ev) => dragStart(ev, e, 0)}
          onClick={() => onOpen?.(e.id)}
          onContextMenu={onEntryMenu ? (ev) => onEntryMenu(ev, e.id) : undefined}
          title={e.title || l.untitled}
          style={entryStyle(e.color)}
          className="truncate rounded-sm px-1.5 py-0.5 text-left text-[11px] leading-4 text-text hover:brightness-110"
        >
          {e.title || l.untitled}
        </button>
      ))}
    </div>
  );
}

function DayColumn({
  date,
  isToday,
  entries,
  l,
  onCreate,
  onMove,
  onResize,
  onOpen,
  onEntryMenu,
}: Shared & { date: string; isToday: boolean; entries: CalendarEntry[] }) {
  const col = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [draw, setDraw] = useState<{ from: number; to: number } | null>(null);
  const [resize, setResize] = useState<{ id: string; end: number } | null>(null);
  const zone = useDrop(
    (id, e) => {
      setHover(null);
      if (col.current) onMove?.(id, date, fromMinutes(Math.max(0, minutesAt(col.current, e.clientY) - grabbed)));
    },
    (e) => col.current && setHover(Math.max(0, minutesAt(col.current, e.clientY) - grabbed)),
  );
  const now = useNow(isToday);
  const spans = entries.map((e) => ({ e, s: timeSpan(e.start, e.end)! }));
  const layout = layoutDay(spans.map(({ e, s }) => ({ id: e.id, ...s })));

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!onCreate || e.button !== 0 || e.target !== e.currentTarget) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const m = minutesAt(e.currentTarget, e.clientY);
    setDraw({ from: m, to: m });
  };
  const onPointerUp = () => {
    if (!draw) return;
    const start = Math.min(draw.from, draw.to);
    const end = Math.max(draw.from, draw.to);
    setDraw(null);
    onCreate?.(date, fromMinutes(start), fromMinutes(end > start ? end + SNAP : start + 60));
  };

  return (
    <div
      ref={col}
      {...(onMove ? zone.props : {})}
      onDragLeave={(e) => {
        zone.props.onDragLeave(e);
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setHover(null);
      }}
      onPointerDown={onPointerDown}
      onPointerMove={(e) => draw && setDraw({ ...draw, to: minutesAt(e.currentTarget, e.clientY) })}
      onPointerUp={onPointerUp}
      onPointerCancel={() => setDraw(null)}
      className={cn("relative touch-none border-l border-border", onCreate && "cursor-cell", isToday && "bg-accent-muted/15")}
      style={{
        backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${HOUR - 1}px, var(--color-border) ${HOUR - 1}px, var(--color-border) ${HOUR}px)`,
      }}
    >
      {spans.map(({ e, s }) => {
        const end = resize?.id === e.id ? resize.end : s.end;
        const pos = layout.get(e.id) ?? { col: 0, cols: 1 };
        const short = end - s.start < 45;
        const movable = !!onMove && !e.locked;
        return (
          <div
            key={e.id}
            draggable={movable && !resize}
            onDragStart={(ev) => dragStart(ev, e, Math.round((((ev.clientY - ev.currentTarget.getBoundingClientRect().top) / HOUR) * 60) / SNAP) * SNAP)}
            onClick={() => onOpen?.(e.id)}
            onContextMenu={onEntryMenu ? (ev) => onEntryMenu(ev, e.id) : undefined}
            title={[e.title || l.untitled, `${fromMinutes(s.start)} – ${fromMinutes(end)}`, e.subtitle].filter(Boolean).join(" · ")}
            className="absolute z-10 flex cursor-pointer flex-col overflow-hidden rounded-sm px-1.5 py-0.5 text-[11px] leading-4 text-text transition-[filter] hover:brightness-110"
            style={{
              ...entryStyle(e.color),
              top: (s.start / 60) * HOUR + 1,
              height: Math.max(18, ((end - s.start) / 60) * HOUR - 2),
              left: `calc(${(pos.col / pos.cols) * 100}% + 2px)`,
              width: `calc(${100 / pos.cols}% - 4px)`,
            }}
          >
            {short ? (
              <span className="truncate">
                <span className="font-medium">{e.title || l.untitled}</span> <span className="text-text-muted">{fromMinutes(s.start)}</span>
              </span>
            ) : (
              <>
                <span className="line-clamp-2 font-medium">{e.title || l.untitled}</span>
                <span className="truncate tabular-nums text-text-muted">
                  {fromMinutes(s.start)} – {fromMinutes(end)}
                </span>
                {e.subtitle && <span className="truncate text-text-muted">{e.subtitle}</span>}
              </>
            )}
            {onResize && !e.locked && (
              <span
                aria-hidden
                draggable={false}
                onClick={(ev) => ev.stopPropagation()}
                onPointerDown={(ev) => {
                  ev.stopPropagation();
                  ev.currentTarget.setPointerCapture(ev.pointerId);
                  setResize({ id: e.id, end: s.end });
                }}
                onPointerMove={(ev) => {
                  if (resize?.id === e.id && col.current) setResize({ id: e.id, end: Math.max(s.start + SNAP, minutesAt(col.current, ev.clientY)) });
                }}
                onPointerUp={() => {
                  if (resize?.id === e.id) onResize(e.id, fromMinutes(resize.end));
                  setResize(null);
                }}
                className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize"
              />
            )}
          </div>
        );
      })}
      {draw && (
        <div
          className="pointer-events-none absolute inset-x-0.5 z-20 rounded-sm border border-accent bg-accent-muted/60 px-1.5 text-[11px] tabular-nums text-text"
          style={{ top: (Math.min(draw.from, draw.to) / 60) * HOUR, height: (Math.max(SNAP, Math.abs(draw.to - draw.from) + SNAP) / 60) * HOUR }}
        >
          {fromMinutes(Math.min(draw.from, draw.to))}
        </div>
      )}
      {zone.over && hover !== null && (
        <div className="pointer-events-none absolute inset-x-0 z-20 border-t-2 border-accent" style={{ top: (hover / 60) * HOUR }}>
          <span className="absolute -top-2.5 left-1 rounded-sm bg-accent px-1 text-[10px] tabular-nums text-bg">{fromMinutes(hover)}</span>
        </div>
      )}
      {now !== null && (
        <div className="pointer-events-none absolute inset-x-0 z-20 border-t border-danger" style={{ top: (now / 60) * HOUR }}>
          <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-danger" />
        </div>
      )}
    </div>
  );
}

/** Width taken by a classic (non-overlay) scrollbar on that element; 0 with overlay scrollbars. */
function useScrollbarWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.offsetWidth - el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

/** Minutes since midnight, refreshed every minute; null when not needed. */
function useNow(active: boolean): number | null {
  const read = () => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  };
  const [now, setNow] = useState(read);
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(read()), 60_000);
    return () => clearInterval(timer);
  }, [active]);
  return active ? now : null;
}
