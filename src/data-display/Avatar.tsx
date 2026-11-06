import { useState } from "react";
import { cn } from "../lib/cn";

export type AvatarStatus = "online" | "away" | "busy" | "offline";

export interface AvatarProps {
  name: string;
  src?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg";
  status?: AvatarStatus;
  /** Colour of the initial when there is no photo (a member colour). */
  color?: string;
  className?: string;
}

const SIZE = { sm: "h-6 w-6 text-[10px]", md: "h-8 w-8 text-xs", lg: "h-12 w-12 text-base" } as const;
const DOT = { sm: "h-2 w-2", md: "h-2.5 w-2.5", lg: "h-3 w-3" } as const;
const STATUS_COLOR: Record<AvatarStatus, string> = {
  online: "bg-accent",
  away: "bg-accent-2",
  busy: "bg-danger",
  offline: "bg-text-muted",
};

/** Round photo or initial, with an optional presence dot (CoreSys DS `Avatar`): sm 24, md 32, lg 48; the initial sits on
 * `surface-raised` with a border; the dot is ringed in `bg`. */
export function Avatar({ name, src, alt, size = "md", status, color, className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const label = status ? `${name}, ${status}` : name;

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      {src && !failed ? (
        <img src={src} alt={status ? label : (alt ?? name)} onError={() => setFailed(true)} className={cn("rounded-full object-cover", SIZE[size])} />
      ) : (
        <span
          role="img"
          aria-label={label}
          title={name}
          style={color ? { color } : undefined}
          className={cn("flex items-center justify-center rounded-full border border-border bg-surface-raised font-medium text-text", SIZE[size])}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      {status && <span aria-hidden="true" className={cn("absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-bg", DOT[size], STATUS_COLOR[status])} />}
    </span>
  );
}
