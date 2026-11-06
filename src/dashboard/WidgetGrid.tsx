import { useCallback, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { COLS, colsFor, derive, move, nextInReadingOrder, resize, type Bounds, type Box, type WidgetSize } from "../lib/grid";
import { useGridDrag } from "./useGridDrag";
import { WidgetBoundary } from "./WidgetBoundary";
import { WidgetFrame, type FrameEdit, type WidgetFrameLabels } from "./WidgetFrame";

export interface WidgetGridLabels extends WidgetFrameLabels {
  /** Read with every card while editing: how to move and resize with the keyboard. */
  hint: string;
  cannotGoFurther: (name: string) => string;
  movedTo: (name: string, x: number, y: number) => string;
  resizedTo: (name: string, w: number, h: number) => string;
  broken: string;
}

const DEFAULT_LABELS: WidgetGridLabels = {
  hint: "Drag a card to move it, its corner to resize it. With the keyboard: arrows move, Shift and arrows resize, Delete removes.",
  move: (n) => `Move ${n}`,
  resize: (n) => `Resize ${n}`,
  settings: (n) => `Settings of ${n}`,
  actions: (n) => `Actions for ${n}`,
  remove: (n) => `Remove ${n}`,
  duplicate: "Duplicate",
  removeAction: "Remove",
  cannotGoFurther: (n) => `${n} can't go further.`,
  movedTo: (n, x, y) => `${n} moved to column ${x}, row ${y}.`,
  resizedTo: (n, w, h) => `${n} resized to ${w} by ${h}.`,
  broken: "This widget couldn't be shown.",
};

export interface WidgetGridProps<T extends Box> {
  /** The saved layout: 12 columns, positions in cells. */
  widgets: T[];
  renderWidget: (widget: T, ctx: { editing: boolean; size: WidgetSize }) => ReactNode;
  /** The card's accessible name ("Recent projects"). */
  label: (widget: T) => string;
  editing?: boolean;
  /** Size limits of a widget; default 1×1 to 12×8. */
  bounds?: (widget: T) => Bounds;
  /** A new layout after a move or a resize (once per cell crossed while dragging). */
  onChange?: (widgets: T[]) => void;
  onRemove?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  canDuplicate?: boolean;
  /** Shown on a card when given and `hasSettings` says so. */
  onSettings?: (id: string) => void;
  hasSettings?: (widget: T) => boolean;
  /** A config or anything whose change should give a broken widget another try. */
  resetKey?: (widget: T) => unknown;
  /** Row height and gap in px (80 / 12). */
  rowHeight?: number;
  gap?: number;
  labels?: Partial<WidgetGridLabels>;
}

type Mode = "move" | "resize";
const ARROWS: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
const ANY: Bounds = { min: { w: 1, h: 1 }, max: { w: COLS, h: 8 } };

/** A dashboard of widget cards on a 12-column grid. Shown, it reflows to 8, 4
 * or 1 column as the space narrows (never saved). Edited, it stays at 12: drag a
 * card to move it, its corner to resize it, neighbours make room and the grid
 * compacts; with the keyboard, arrows move, Shift+arrows resize, Delete removes,
 * each change announced. Every card has its own error boundary, and content
 * larger than a card scrolls inside it with faded edges. Controlled: the layout
 * comes in through `widgets` and goes out through `onChange`. */
export function WidgetGrid<T extends Box>({
  widgets,
  renderWidget,
  label,
  editing = false,
  bounds = () => ANY,
  onChange,
  onRemove,
  onDuplicate,
  canDuplicate = true,
  onSettings,
  hasSettings,
  resetKey,
  rowHeight = 80,
  gap = 12,
  labels,
}: WidgetGridProps<T>) {
  const l = { ...DEFAULT_LABELS, ...labels };
  const grid = useRef<HTMLDivElement>(null);
  const width = useWidth(grid);
  const cols = editing ? COLS : colsFor(width);
  const placed = useMemo(() => (editing ? widgets : derive(widgets, cols)), [editing, widgets, cols]);
  const [active, setActive] = useState<{ id: string; mode: Mode } | null>(null);
  const [said, setSaid] = useState({ text: "", n: 0 });
  const hintId = useId();
  const gesture = useRef<{ id: string; mode: Mode; base: T[]; start: T } | null>(null);
  const latest = useRef({ widgets, width, bounds, onChange, onRemove, label, l });
  latest.current = { widgets, width, bounds, onChange, onRemove, label, l };

  const announce = useCallback((text: string) => setSaid((s) => ({ text, n: s.n + 1 })), []);
  const remove = useCallback((id: string) => {
    const { widgets, onRemove } = latest.current;
    const after = nextInReadingOrder(widgets, id);
    onRemove?.(id);
    requestAnimationFrame(() => {
      const el = after && grid.current?.querySelector<HTMLElement>(`[data-widget-id="${CSS.escape(after)}"] [role=group]`);
      (el || grid.current)?.focus({ preventScroll: true });
    });
  }, []);

  const handlers = useMemo<Handlers>(
    () => ({
      hintId,
      metrics: () => ({ w: Math.max(1, (latest.current.width - (COLS - 1) * gap) / COLS), h: rowHeight, gap }),
      start: (id, mode) => {
        const start = latest.current.widgets.find((w) => w.id === id);
        if (!start) return;
        gesture.current = { id, mode, base: latest.current.widgets, start };
        setActive({ id, mode });
      },
      step: (dx, dy) => {
        const g = gesture.current;
        if (!g) return;
        const { bounds, onChange } = latest.current;
        onChange?.(
          g.mode === "move"
            ? move(g.base, g.id, { x: g.start.x + dx, y: g.start.y + dy })
            : resize(g.base, g.id, { w: g.start.w + dx, h: g.start.h + dy }, bounds(g.start)),
        );
      },
      cancel: () => gesture.current && latest.current.onChange?.(gesture.current.base),
      end: () => {
        gesture.current = null;
        setActive(null);
      },
      key: (id, e) => {
        const { widgets, bounds, onChange, label, l } = latest.current;
        if (gesture.current) return;
        if ((e.key === "Delete" || e.key === "Backspace") && latest.current.onRemove) {
          e.preventDefault();
          remove(id);
          return;
        }
        const arrow = ARROWS[e.key];
        const from = widgets.find((w) => w.id === id);
        if (!arrow || !from || e.altKey || e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        const mode: Mode = e.shiftKey ? "resize" : "move";
        const next = nudge(widgets, from, mode, arrow[0], arrow[1], bounds(from));
        const name = label(from);
        if (!next) return announce(l.cannotGoFurther(name));
        onChange?.(next);
        const b = next.find((w) => w.id === id)!;
        announce(mode === "move" ? l.movedTo(name, b.x + 1, b.y + 1) : l.resizedTo(name, b.w, b.h));
      },
    }),
    [hintId, gap, rowHeight, announce, remove],
  );

  const ghost = active ? placed.find((w) => w.id === active.id) : undefined;
  return (
    <div>
      {editing && (
        <p id={hintId} className="sr-only">
          {l.hint}
        </p>
      )}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {said.text}
        {said.n % 2 ? "​" : ""}
      </div>
      <div
        ref={grid}
        tabIndex={-1}
        className="grid outline-none"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridAutoRows: `${rowHeight}px`, gap }}
      >
        {ghost && (
          <div
            aria-hidden
            className="rounded-lg border-2 border-dashed border-accent/50 bg-accent-muted/20"
            style={{ gridColumn: `${ghost.x + 1} / span ${ghost.w}`, gridRow: `${ghost.y + 1} / span ${ghost.h}` }}
          />
        )}
        {placed.map((box) => (
          <Cell
            key={box.id}
            box={box}
            name={label(box)}
            editing={editing}
            lifted={active?.id === box.id}
            handlers={handlers}
            frameLabels={l}
            broken={l.broken}
            onRemove={onRemove ? () => remove(box.id) : undefined}
            onDuplicate={onDuplicate ? () => onDuplicate(box.id) : undefined}
            canDuplicate={canDuplicate}
            onSettings={onSettings && hasSettings?.(box) !== false ? () => onSettings(box.id) : undefined}
            resetKey={resetKey?.(box)}
          >
            {renderWidget(box, { editing, size: { w: box.w, h: box.h } })}
          </Cell>
        ))}
      </div>
    </div>
  );
}

interface Handlers {
  hintId: string;
  metrics: () => { w: number; h: number; gap: number };
  start: (id: string, mode: Mode) => void;
  step: (dx: number, dy: number) => void;
  cancel: () => void;
  end: () => void;
  key: (id: string, e: KeyboardEvent) => void;
}

/** One keyboard step: a resize by one cell, or a move to the next position the layout accepts. Null when nothing changes. */
function nudge<T extends Box>(widgets: T[], from: T, mode: Mode, dx: number, dy: number, b: Bounds): T[] | null {
  const at = (n: T[]) => n.find((w) => w.id === from.id)!;
  if (mode === "resize") {
    const n = resize(widgets, from.id, { w: from.w + dx, h: from.h + dy }, b);
    const r = at(n);
    return r.w === from.w && r.h === from.h ? null : n;
  }
  // Below the lowest widget there is nothing left to pass; sideways, the grid is 12 columns wide.
  const reach = dy > 0 ? Math.max(0, ...widgets.map((w) => w.y + w.h)) : dy < 0 ? from.y : COLS;
  for (let k = 1; k <= reach; k++) {
    const n = move(widgets, from.id, { x: from.x + dx * k, y: from.y + dy * k });
    const r = at(n);
    if (r.x !== from.x || r.y !== from.y) return n;
    if (dx !== 0) break;
  }
  return null;
}

interface CellProps<T extends Box> {
  box: T;
  name: string;
  editing: boolean;
  lifted: boolean;
  handlers: Handlers;
  frameLabels: WidgetFrameLabels;
  broken: string;
  onRemove?: () => void;
  onDuplicate?: () => void;
  canDuplicate: boolean;
  onSettings?: () => void;
  resetKey?: unknown;
  children: ReactNode;
}

function Cell<T extends Box>({
  box,
  name,
  editing,
  lifted,
  handlers,
  frameLabels,
  broken,
  onRemove,
  onDuplicate,
  canDuplicate,
  onSettings,
  resetKey,
  children,
}: CellProps<T>) {
  // The card follows the pointer between two cells without a render: its offset is set on the element, measured
  // from the cells it holds now (the layout moves it one cell at a time).
  const wrap = useRef<HTMLDivElement>(null);
  const live = useRef<{ mode: Mode; px: number; py: number; start: Box } | null>(null);
  const boxNow = useRef<Box>(box);
  boxNow.current = box;
  const paint = useCallback(() => {
    const el = wrap.current;
    if (!el) return;
    const g = live.current;
    el.style.transform = "";
    el.style.width = "";
    el.style.height = "";
    if (!g) return;
    const { w: cw, h: ch, gap } = handlers.metrics();
    const sx = cw + gap;
    const sy = ch + gap;
    const b = boxNow.current;
    if (g.mode === "move") el.style.transform = `translate(${g.px - (b.x - g.start.x) * sx}px, ${g.py - (b.y - g.start.y) * sy}px)`;
    else {
      el.style.width = `${Math.max(cw, g.start.w * sx - gap + g.px)}px`;
      el.style.height = `${Math.max(ch, g.start.h * sy - gap + g.py)}px`;
    }
  }, [handlers]);
  useLayoutEffect(paint, [box.x, box.y, box.w, box.h, paint]);

  const drag = (mode: Mode) => ({
    cell: handlers.metrics,
    onStart: () => {
      live.current = { mode, px: 0, py: 0, start: { ...boxNow.current } };
      handlers.start(box.id, mode);
    },
    onFrame: (px: number, py: number) => {
      if (!live.current) return;
      live.current.px = px;
      live.current.py = py;
      paint();
    },
    onMove: handlers.step,
    onCancel: handlers.cancel,
    onEnd: () => {
      live.current = null;
      paint();
      handlers.end();
    },
  });
  const moveDrag = useGridDrag(drag("move"));
  const resizeDrag = useGridDrag(drag("resize"));

  const edit: FrameEdit | null = editing
    ? {
        hintId: handlers.hintId,
        lifted,
        onMoveDown: moveDrag.onPointerDown,
        onResizeDown: resizeDrag.onPointerDown,
        onKeyDown: (e) => handlers.key(box.id, e),
        onRemove: onRemove ?? (() => {}),
        onDuplicate,
        canDuplicate,
        onSettings,
        labels: frameLabels,
      }
    : null;

  return (
    <WidgetFrame ref={wrap} box={box} label={name} edit={edit}>
      <WidgetBoundary resetKey={resetKey} onRemove={onRemove} labels={{ broken, remove: frameLabels.removeAction }}>
        {children}
      </WidgetBoundary>
    </WidgetFrame>
  );
}

/** The element's width, measured before the first paint so there is no 1-column flash. */
function useWidth(ref: React.RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}
