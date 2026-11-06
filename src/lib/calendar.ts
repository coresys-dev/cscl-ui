/** "HH:MM" as minutes since midnight; null when empty or malformed. */
export function toMinutes(time: string | null | undefined): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time ?? "");
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Minutes since midnight as "HH:MM", clamped to the day. */
export function fromMinutes(n: number): string {
  const c = Math.max(0, Math.min(23 * 60 + 59, Math.round(n)));
  return `${String(Math.floor(c / 60)).padStart(2, "0")}:${String(c % 60).padStart(2, "0")}`;
}

/** Start and end in minutes of a timed entry; an end missing or before the start reads as one hour. */
export function timeSpan(start: string | null | undefined, end: string | null | undefined): { start: number; end: number } | null {
  const s = toMinutes(start);
  if (s === null) return null;
  const e = toMinutes(end);
  return { start: s, end: e !== null && e > s ? e : Math.min(s + 60, 24 * 60) };
}

/** Side-by-side columns for overlapping entries, like any agenda: each id gets its column and the cluster's column count. */
export function layoutDay(entries: { id: string; start: number; end: number }[]): Map<string, { col: number; cols: number }> {
  const out = new Map<string, { col: number; cols: number }>();
  const sorted = [...entries].sort((a, b) => a.start - b.start || b.end - a.end);
  let cluster: string[] = [];
  let ends: number[] = [];
  let clusterEnd = -1;
  const close = () => {
    for (const id of cluster) out.set(id, { col: out.get(id)!.col, cols: ends.length });
    cluster = [];
    ends = [];
  };
  for (const e of sorted) {
    if (e.start >= clusterEnd) close();
    let col = ends.findIndex((end) => end <= e.start);
    if (col < 0) {
      col = ends.length;
      ends.push(e.end);
    } else ends[col] = e.end;
    out.set(e.id, { col, cols: 1 });
    cluster.push(e.id);
    clusterEnd = Math.max(clusterEnd, e.end);
  }
  close();
  return out;
}

/** The weeks of a month (0-based `month`), each 7 day numbers with `null` outside the month. */
export function monthGrid(year: number, month: number, weekStartsMonday = true): (number | null)[][] {
  const first = new Date(year, month, 1).getDay();
  const lead = weekStartsMonday ? (first + 6) % 7 : first;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}

/** The 7 local ISO dates of the week starting at `start`. */
export function weekDays(start: string): string[] {
  // Same arithmetic as `addDaysISO` in heat.ts; kept local so this module stays import-free for the Node tests.
  const [y, m, d] = start.split("-").map(Number);
  return Array.from({ length: 7 }, (_, i) => {
    const t = new Date(y, m - 1, d + i);
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  });
}

/** Short weekday names in display order (Monday first by default), from `Intl`. */
export function weekdayNames(locale?: string, weekStartsMonday = true, style: "short" | "narrow" | "long" = "short"): string[] {
  // 2024-01-01 was a Monday.
  const names = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: style }));
  return weekStartsMonday ? names : [names[6], ...names.slice(0, 6)];
}
