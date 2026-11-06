/** Stroke dash values of a progress ring: the ratio is brought into 0..1 (anything else counts as 0). */
export function ringDash(ratio: number, radius: number): { circumference: number; offset: number } {
  const r = Number.isFinite(ratio) ? Math.min(1, Math.max(0, ratio)) : 0;
  const circumference = 2 * Math.PI * radius;
  return { circumference, offset: circumference * (1 - r) };
}

/** Dash values of a ring cut into one arc per share: arcs run in order from the top, a small gap between them (none when a single arc fills the ring). */
export function segmentDashes(counts: number[], radius: number, gap = 3): { dash: number; offset: number }[] {
  const circumference = 2 * Math.PI * radius;
  const total = counts.reduce((n, c) => n + (Number.isFinite(c) && c > 0 ? c : 0), 0);
  if (total === 0) return counts.map(() => ({ dash: 0, offset: 0 }));
  const shown = counts.filter((c) => c > 0).length;
  const g = shown > 1 ? Math.min(gap, circumference / shown / 2) : 0;
  let start = 0;
  return counts.map((c) => {
    if (!(c > 0)) return { dash: 0, offset: 0 };
    const len = (c / total) * circumference;
    const out = { dash: Math.max(0, len - g), offset: -start };
    start += len;
    return out;
  });
}
