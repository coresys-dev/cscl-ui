/** Intensity level 0..4 of a value: 0 for nothing, then quarters of the max (any positive value is at least 1). */
export function heatLevel(value: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (value <= 0 || max <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((value / max) * 4))) as 1 | 2 | 3 | 4;
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Adds days to a local ISO date (`YYYY-MM-DD`), safe across DST changes. */
export function addDaysISO(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return iso(new Date(y, m - 1, d + n));
}

/** The Monday of the week holding a local ISO date. */
export function mondayOf(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const weekday = (new Date(y, m - 1, d).getDay() + 6) % 7;
  return addDaysISO(day, -weekday);
}

export interface CalendarHeatCell {
  date: string;
  value: number;
}

/** A contribution calendar: 7 rows (Monday..Sunday) by `weeks` columns ending
 * with the week of `today`; days after `today` are `null`. */
export function calendarHeatmap(values: ReadonlyMap<string, number>, today: string, weeks: number): (CalendarHeatCell | null)[][] {
  const n = Math.max(1, weeks);
  const first = addDaysISO(mondayOf(today), -7 * (n - 1));
  return Array.from({ length: 7 }, (_, d) =>
    Array.from({ length: n }, (_, w) => {
      const date = addDaysISO(first, w * 7 + d);
      return date > today ? null : { date, value: values.get(date) ?? 0 };
    }),
  );
}
