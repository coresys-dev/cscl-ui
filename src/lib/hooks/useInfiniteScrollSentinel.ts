import { useEffect, useRef } from "react";

/** Ref to place on a sentinel element at the end of a list: fires `onReach`
 * once it becomes visible. */
export function useInfiniteScrollSentinel(onReach: () => void, enabled: boolean) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onReach();
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [onReach, enabled]);

  return sentinelRef;
}
