import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

/** Shimmer placeholder block. Compose several to sketch the shape of content
 * that is still loading; give each one a width/height via `className`. */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-border", className)} {...props} />;
}
