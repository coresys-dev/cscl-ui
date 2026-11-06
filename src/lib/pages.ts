/** The page buttons to show: first, last, the current page and its neighbours,
 * with `"gap"` where pages are skipped. A gap of exactly one page shows that
 * page instead of an ellipsis. */
export function pageItems(page: number, count: number): (number | "gap")[] {
  if (count < 1) return [];
  const shown = [...new Set([1, count, page - 1, page, page + 1])].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  for (const n of shown) {
    const prev = out[out.length - 1];
    if (typeof prev === "number" && n - prev === 2) out.push(prev + 1);
    else if (typeof prev === "number" && n - prev > 2) out.push("gap");
    out.push(n);
  }
  return out;
}
