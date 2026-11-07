import { cn } from "../lib/cn";
import { CORE, RINGS } from "./markPaths";

export interface SplashMarkProps {
  size?: number;
  /** The core keeps its own colour on the boot splash (the CoreSys green by default). */
  coreColor?: string;
  className?: string;
}

/** The mark of the boot splash: the full rings at any size (no small drawing), in the text
 * colour, with the core in its own colour. Decorative: it sits next to the word "coresys". */
export function SplashMark({ size = 20, coreColor = "#38d49b", className }: SplashMarkProps) {
  return (
    <svg viewBox="116 116 792 792" width={size} height={size} aria-hidden className={cn("inline-block shrink-0", className)}>
      <path d={RINGS} fill="currentColor" />
      <path d={CORE} fill={coreColor} />
    </svg>
  );
}
