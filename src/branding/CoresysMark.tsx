import { cn } from "../lib/cn";

import { CORE, RINGS, SMALL } from "./markPaths";

export interface CoresysMarkProps {
  /** Rendered size in px. At 24 and below the small drawing is used. */
  size?: number;
  /** Only in a product signature ("by coresys") may the core take the product's accent. */
  coreColor?: string;
  className?: string;
  /** Accessible name; omit when the mark is decorative. */
  title?: string;
}

/** The CoreSys mark: one flat colour (`currentColor`), never rotated, never a gradient. */
export function CoresysMark({ size = 20, coreColor, className, title }: CoresysMarkProps) {
  const small = size <= 24;
  return (
    <svg
      viewBox="116 116 792 792"
      width={size}
      height={size}
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn("inline-block shrink-0", className)}
    >
      {small ? (
        <path d={SMALL} />
      ) : (
        <>
          <path d={RINGS} />
          <path d={CORE} fill={coreColor} />
        </>
      )}
    </svg>
  );
}
