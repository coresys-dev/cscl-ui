import type { ReactNode } from "react";
import { segmentDashes } from "./ringMath";

/** A ring cut into one coloured arc per share, over a surface track. */
export function Donut({
  slices,
  size = 72,
  stroke = 8,
  children,
}: {
  slices: { count: number; color: string }[];
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const arcs = segmentDashes(
    slices.map((s) => s.count),
    radius,
  );
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-surface-hover)" strokeWidth={stroke} />
        {slices.map((s, i) =>
          arcs[i].dash > 0 ? (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${arcs[i].dash} ${circumference}`}
              strokeDashoffset={arcs[i].offset}
            />
          ) : null,
        )}
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center text-center">{children}</div>}
    </div>
  );
}
