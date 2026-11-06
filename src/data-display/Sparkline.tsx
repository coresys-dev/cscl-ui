/** Small data trend line (a muted polyline), `values` normalised to their max. For audio, see `MiniWaveform`. */
export function Sparkline({ values, className = "h-6 w-24" }: { values: number[]; className?: string }) {
  if (values.length < 2) return <div className={`${className} shrink-0`} aria-hidden />;
  const max = Math.max(...values, 1);
  const w = values.length - 1;
  const d = values.map((p, i) => `${i === 0 ? "M" : "L"}${i} ${100 - (p / max) * 92 - 4}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} 100`} preserveAspectRatio="none" className={`${className} shrink-0 text-text-muted`} aria-hidden>
      <path d={d} stroke="currentColor" strokeWidth={2} fill="none" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
