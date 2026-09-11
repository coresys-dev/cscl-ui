import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_RETRIES, retrySchedule } from "../retry";

/** Possible states of an async resource. */
export type LoadStatus = "loading" | "ready" | "error";

export interface AsyncResource<T> {
  status: LoadStatus;
  /** Last known value, kept as-is through errors. */
  data: T | null;
  error: string | null;
  /** `true` between a failed attempt and the next one (backoff in progress). */
  retrying: boolean;
  /** `true` once the first cycle has finished (success OR gave up); stays `true`. */
  settled: boolean;
  reload: () => void;
}

interface State<T> {
  status: LoadStatus;
  data: T | null;
  error: string | null;
  retrying: boolean;
  settled: boolean;
}

/**
 * Wraps an async `fetcher` so the UI never blanks out on a transient error:
 *
 * - the last known data stays displayed while a reload is failing;
 * - on failure, retries with {@link retrySchedule}'s backoff until success
 *   or giving up (`status: "error"`);
 * - while in the error state, the window regaining focus (or a
 *   `visibilitychange`) triggers another `reload()`.
 *
 * One cycle = attempt 0, then attempt n+1 scheduled `retrySchedule(n)` ms
 * after attempt n fails, until `retrySchedule` returns -1.
 *
 * @param fetcher load function (recreated every render: frozen into a ref)
 * @param deps    dependencies that, on change, restart a cycle
 */
export function useAsyncResource<T>(fetcher: () => Promise<T>, deps: unknown[]): AsyncResource<T> {
  const [state, setState] = useState<State<T>>({
    status: "loading",
    data: null,
    error: null,
    retrying: false,
    settled: false,
  });

  const timer = useRef<number | undefined>(undefined);
  const runId = useRef(0);

  // `fetcher`'s identity changes every render: freeze it in a ref and drive
  // re-runs from `deps` alone.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // Mirror of state readable without making the focus-listener effect
  // depend on it (that effect should only depend on `reload`).
  const stateRef = useRef(state);
  stateRef.current = state;

  const attempt = useCallback((n: number, id: number) => {
    fetcherRef
      .current()
      .then((data) => {
        if (runId.current !== id) return; // superseded cycle: ignore
        setState({
          status: "ready",
          data,
          error: null,
          retrying: false,
          settled: true,
        });
      })
      .catch((e: unknown) => {
        if (runId.current !== id) return; // superseded cycle: ignore
        const msg = e instanceof Error ? e.message : String(e);
        const delay = n < MAX_RETRIES ? retrySchedule(n) : -1;
        if (delay >= 0) {
          setState((s) => ({
            ...s,
            status: s.data ? s.status : "loading",
            error: msg,
            retrying: true,
          }));
          timer.current = window.setTimeout(() => attempt(n + 1, id), delay);
        } else {
          setState((s) => ({
            status: "error",
            data: s.data,
            error: msg,
            retrying: false,
            settled: true,
          }));
        }
      });
  }, []);

  const reload = useCallback(() => {
    window.clearTimeout(timer.current);
    const id = ++runId.current;
    setState((s) => ({
      ...s,
      status: s.data ? s.status : "loading",
      retrying: s.data != null,
    }));
    attempt(0, id);
  }, [attempt]);

  // Initial cycle + restart on every `deps` change.
  useEffect(() => {
    reload();
    return () => window.clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- driven by `deps` (fetcher frozen in a ref)
  }, deps);

  // Re-fetch when the window regains focus, if currently in error.
  useEffect(() => {
    const onFocus = () => {
      if (runId.current && stateRef.current.status === "error") reload();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [reload]);

  return { ...state, reload };
}
