// Pure grid engine of a widget dashboard: no React. Every function returns new boxes and never mutates its arguments.
// Boxes may carry extra fields (a WidgetInstance's kind and config): they are copied through untouched.
export interface WidgetSize {
  w: number;
  h: number;
}

export const COLS = 12;

export interface Box {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Bounds {
  min: WidgetSize;
  max: WidgetSize;
}

/** True when the two rectangles share at least one cell. */
export function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** A whole number, or the fallback when the value is not a finite number. */
function int(n: number, fallback: number): number {
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(Math.max(n, lo), hi);
}

/** Size within the bounds and the grid (the grid wins over a minimum wider than it), x + w ≤ cols, x and y ≥ 0. */
export function clampBox<T extends Box>(b: T, bounds: Bounds, cols: number = COLS): T {
  const minW = Math.max(1, int(bounds.min.w, 1));
  const minH = Math.max(1, int(bounds.min.h, 1));
  const maxW = Math.max(minW, int(bounds.max.w, minW));
  const maxH = Math.max(minH, int(bounds.max.h, minH));
  const w = Math.max(1, Math.min(clamp(int(b.w, minW), minW, maxW), cols));
  const h = clamp(int(b.h, minH), minH, maxH);
  return { ...b, w, h, x: clamp(int(b.x, 0), 0, cols - w), y: Math.max(0, int(b.y, 0)) };
}

/**
 * Repairs boxes read from saved data before the engine works on them: each is brought into its bounds (`clampBox`),
 * and a y beyond the sum of all the heights (an absurd value such as 1e9) is brought back to that sum, so that
 * `compact`, which rises one row at a time, stays fast. A compact layout always fits under that sum, so valid data
 * never changes.
 */
export function sanitize<T extends Box>(boxes: T[], boundsOf: (b: T) => Bounds, cols: number = COLS): T[] {
  const fitted = boxes.map((b) => clampBox(b, boundsOf(b), cols));
  const cap = fitted.reduce((n, b) => n + b.h, 0);
  return fitted.map((b) => (b.y > cap ? { ...b, y: cap } : b));
}

/** Indices in reading order (y, then x, then position in the array). */
function readingOrder(boxes: Box[]): number[] {
  return boxes.map((_, i) => i).sort((i, j) => boxes[i].y - boxes[j].y || boxes[i].x - boxes[j].x || i - j);
}

function hitsAny(box: Box, others: Box[]): boolean {
  return others.some((o) => overlaps(box, o));
}

/**
 * Vertical compaction: in reading order, each box first drops below anything already settled that it overlaps,
 * then rises while it touches nothing. The array order of the result is the input order. Idempotent.
 */
export function compact<T extends Box>(boxes: T[]): T[] {
  const out = boxes.map((b) => ({ ...b }));
  const settled: Box[] = [];
  for (const i of readingOrder(out)) {
    const b = out[i];
    b.y = Math.max(0, b.y);
    while (hitsAny(b, settled)) b.y++;
    while (b.y > 0 && !hitsAny({ ...b, y: b.y - 1 }, settled)) b.y--;
    settled.push(b);
  }
  return out;
}

/** First free cell for a box of this size, top to bottom then left to right. The width is capped to the grid. */
export function place(boxes: Box[], size: WidgetSize, cols: number = COLS): { x: number; y: number } {
  const w = clamp(int(size.w, 1), 1, cols);
  const h = Math.max(1, int(size.h, 1));
  for (let y = 0; ; y++) {
    for (let x = 0; x + w <= cols; x++) {
      if (!hitsAny({ id: "", x, y, w, h }, boxes)) return { x, y };
    }
  }
}

/** Pushes down, in reading order, every box that overlaps `out[from]`, then whatever those push in turn. `fixed` never moves. */
function pushDown(out: Box[], from: number, fixed: number): void {
  const pusher = out[from];
  for (const i of readingOrder(out)) {
    if (i === from || i === fixed || !overlaps(pusher, out[i])) continue;
    out[i].y = pusher.y + pusher.h;
    pushDown(out, i, fixed);
  }
}

/**
 * The box `at` index has been given its new rectangle in `out`: makes room for it, then compacts.
 * When it went down onto a neighbour, the neighbour first tries to jump just above it (so dragging down swaps);
 * otherwise neighbours are pushed down.
 */
function settleAround<T extends Box>(out: T[], at: number, wentDown: boolean): T[] {
  const moved = out[at];
  for (const i of readingOrder(out)) {
    if (i === at || !overlaps(moved, out[i])) continue;
    if (wentDown) {
      const above = { ...out[i], y: moved.y - out[i].h };
      if (
        above.y >= 0 &&
        !hitsAny(
          above,
          out.filter((_, j) => j !== i),
        )
      ) {
        out[i].y = above.y;
        continue;
      }
    }
    out[i].y = moved.y + moved.h;
    pushDown(out, i, at);
  }
  return compact(out);
}

/** Moves one box (clamped to the grid), pushes what is in the way down, then compacts. Unknown id: unchanged copy. */
export function move<T extends Box>(boxes: T[], id: string, to: { x: number; y: number }, cols: number = COLS): T[] {
  const out = boxes.map((b) => ({ ...b }));
  const at = out.findIndex((b) => b.id === id);
  if (at < 0) return out;
  const from = out[at];
  const w = clamp(int(from.w, 1), 1, cols);
  const target = { ...from, w, x: clamp(int(to.x, from.x), 0, cols - w), y: Math.max(0, int(to.y, from.y)) };
  out[at] = target;
  return settleAround(out, at, target.y > from.y);
}

/** Resizes one box within its bounds (x shifts left if needed), pushes what is in the way down, then compacts. */
export function resize<T extends Box>(boxes: T[], id: string, to: WidgetSize, bounds: Bounds, cols: number = COLS): T[] {
  const out = boxes.map((b) => ({ ...b }));
  const at = out.findIndex((b) => b.id === id);
  if (at < 0) return out;
  out[at] = clampBox({ ...out[at], w: to.w, h: to.h }, bounds, cols);
  return settleAround(out, at, false);
}

/** Number of columns for a grid this wide, in pixels. */
export function colsFor(width: number): 12 | 8 | 4 | 1 {
  if (width >= 900) return 12;
  if (width >= 640) return 8;
  if (width >= 400) return 4;
  return 1;
}

/**
 * Display layout for a number of columns; never saved. At 12 columns the saved positions are kept (no
 * recompaction), only brought inside the grid and freed from overlaps. Below, boxes flow in reading order
 * (y then x): width capped to the grid, x kept when it fits, each placed at or after the previous one, never overlapping.
 */
export function derive<T extends Box>(boxes: T[], cols: 12 | 8 | 4 | 1): T[] {
  const out = boxes.map((b) => {
    const w = clamp(int(b.w, 1), 1, cols);
    return { ...b, w, h: Math.max(1, int(b.h, 1)), x: clamp(int(b.x, 0), 0, cols - w), y: Math.max(0, int(b.y, 0)) };
  });
  // Reading order of the saved layout, before x is squeezed into fewer columns.
  const order = readingOrder(boxes);
  const settled: Box[] = [];
  if (cols === COLS) {
    for (const i of order) {
      while (hitsAny(out[i], settled)) out[i].y++;
      settled.push(out[i]);
    }
    return out;
  }
  let prev = { x: -1, y: 0 };
  for (const i of order) {
    const b = out[i];
    b.y = prev.y;
    while ((b.y === prev.y && b.x <= prev.x) || hitsAny(b, settled)) b.y++;
    prev = { x: b.x, y: b.y };
    settled.push(b);
  }
  return out;
}

/**
 * Resolves overlaps when hidden widgets come back (their module was switched on again).
 * `returning` are the ids of the boxes that come back. The other boxes keep their place: they are laid down first,
 * in reading order, and only one that overlaps another of them (bad data) drops until it is free.
 * Then each returning box, in reading order, keeps its saved cell when it is free, otherwise drops (y + 1 at a time)
 * below whatever blocks it. So when the cell of a returning box was taken meanwhile, the returning box is the one
 * that moves. x, w and h never change; no compaction (the caller compacts while editing). Array order is kept.
 */
export function settle<T extends Box>(boxes: T[], returning: string[]): T[] {
  const out = boxes.map((b) => ({ ...b }));
  const back = new Set(returning);
  const order = readingOrder(out);
  const settled: Box[] = [];
  for (const pass of [false, true]) {
    for (const i of order) {
      if (back.has(out[i].id) !== pass) continue;
      out[i].y = Math.max(0, out[i].y);
      while (hitsAny(out[i], settled)) out[i].y++;
      settled.push(out[i]);
    }
  }
  return out;
}

/**
 * Copies the coordinates of the visible boxes onto the full list; hidden boxes stay exactly as they were.
 * Matched by id, and by rank among equal ids, so a duplicated id (bad saved data) does not collapse two boxes into one place.
 */
export function mergeVisible<T extends Box>(all: T[], visible: Box[]): T[] {
  const byId = new Map<string, Box[]>();
  for (const v of visible) byId.set(v.id, [...(byId.get(v.id) ?? []), v]);
  return all.map((a) => {
    const v = byId.get(a.id)?.shift();
    return v ? { ...a, x: v.x, y: v.y, w: v.w, h: v.h } : { ...a };
  });
}

/**
 * The widget to go on to once `id` is taken off: the next one in reading order (y, then x), or the one before when
 * it was the last. Null when no other widget is left, or `id` is not there.
 */
export function nextInReadingOrder(boxes: Box[], id: string): string | null {
  const order = boxes.map((b, i) => ({ b, i })).sort((p, q) => p.b.y - q.b.y || p.b.x - q.b.x || p.i - q.i);
  const at = order.findIndex((p) => p.b.id === id);
  if (at < 0) return null;
  return (order[at + 1] ?? order[at - 1])?.b.id ?? null;
}
/**
 * How many grid steps a pointer offset covers, to the nearest one. A step is a cell plus the gap after it, so a
 * widget moved by n cells has moved by n * (cell + gap) pixels. Symmetric: -d gives the opposite of d.
 */
export function cellsFromDelta(deltaPx: number, cellPx: number, gap: number): number {
  const step = cellPx + gap;
  if (!(step > 0) || !Number.isFinite(deltaPx)) return 0;
  const n = Math.round(Math.abs(deltaPx) / step);
  return n === 0 ? 0 : Math.sign(deltaPx) * n;
}
