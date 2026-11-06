import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

/**
 * A caption pill overlaid on an image — e.g. screenshot captions on a
 * thumbnail grid or lightbox. It rides on a translucent dark plate with a
 * blur so the text stays legible on any image, regardless of the app's
 * light/dark theme.
 *
 * Render it as a sibling of the image inside a `relative` container.
 */
export function ImageCaption({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute bottom-2 left-2 z-10 max-w-[calc(100%-1rem)] truncate",
        "rounded-lg border border-white/10 bg-black/55 px-2.5 py-1",
        "text-xs font-medium text-white shadow-sm backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}
