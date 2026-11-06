import { useEffect, useState } from "react";

/** The current time, refreshed every `everyMs`; no interval at all when `everyMs` is null (a stopped timer). */
export function useNow(everyMs: number | null): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (everyMs === null) return;
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return now;
}
