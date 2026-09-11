import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

/** CORE-pushed sync state for this app. `synced: true` means CORE is
 * actively driving theme/language for every CoreSys app on this machine —
 * the consuming app's own theme/locale controls should be frozen (disabled)
 * while it's true, and its persisted settings re-read (CORE's backend has
 * already written the synced values to the app's own settings file by the
 * time this flips, so there's nothing else to fetch from this payload
 * itself — see `providers/README.md` for the exact contract). `synced:
 * false` covers "never discovered CORE", "explicitly disabled", and
 * "connection lost" alike — the app falls back to its own persisted values
 * and re-enables its controls. */
export interface SyncLinkStatus {
  synced: boolean;
}

const SyncLinkContext = createContext<SyncLinkStatus | null>(null);

interface SyncLinkProviderProps {
  children: ReactNode;
  /** Tauri command name that returns the current `SyncLinkStatus` at
   * startup. Default matches SLDR's backend (`get_synclink_status`) —
   * override only if your app's Rust side registers it under a different
   * name. */
  getStatusCommand?: string;
  /** Tauri event name the backend emits on every status change. Default
   * matches SLDR's backend (`synclink://state`). */
  eventName?: string;
  /** Called every time the backend pushes a *changed* status via the event
   * (not on the initial startup fetch — see below). This is the hook for
   * the app to re-read whatever it persists locally (theme, locale, …):
   * by the time the event fires, the backend has already written the
   * synced values there, so this callback typically just re-reads settings
   * rather than applying `status` itself. */
  onSync: (status: SyncLinkStatus) => void;
}

/** Tracks CORE-pushed SyncLink state: via `getStatusCommand` once at
 * startup, then live via the `eventName` Tauri event. Only the *event* path
 * calls `onSync` — the startup fetch just seeds local state, since whatever
 * loads the app's persisted settings at startup already reads the
 * up-to-date file the backend maintains (mirrors SLDR's original, which
 * only replayed `refreshSettings()` on the event, not on the initial read).
 *
 * Generic CoreSys infra: every CoreSys app needs to listen for this
 * identically. See `providers/README.md` for what your app's Rust backend
 * must expose for this to work. */
export function SyncLinkProvider({
  children,
  getStatusCommand = "get_synclink_status",
  eventName = "synclink://state",
  onSync,
}: SyncLinkProviderProps) {
  const [status, setStatus] = useState<SyncLinkStatus>({ synced: false });
  // Ref, not a plain effect dependency: keeps the effect below from
  // resubscribing the Tauri listener every time the caller passes a new
  // `onSync` closure (a common case if it's defined inline), while still
  // always calling the latest version.
  const onSyncRef = useRef(onSync);
  useEffect(() => {
    onSyncRef.current = onSync;
  }, [onSync]);

  useEffect(() => {
    invoke<SyncLinkStatus>(getStatusCommand)
      .then(setStatus)
      .catch(() => {
        /* No SyncLink on this platform, or backend unavailable: stay on
           `{ synced: false }` — a normal, fully-supported state. */
      });

    const unlistenPromise = listen<SyncLinkStatus>(eventName, (event) => {
      setStatus(event.payload);
      onSyncRef.current(event.payload);
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [getStatusCommand, eventName]);

  return <SyncLinkContext.Provider value={status}>{children}</SyncLinkContext.Provider>;
}

/** Current SyncLink status. `synced: true` → the app must freeze (and
 * disable) its own theme/language controls: CORE is driving them. */
export function useSyncLink(): SyncLinkStatus {
  const ctx = useContext(SyncLinkContext);
  if (!ctx) throw new Error("useSyncLink must be used within SyncLinkProvider");
  return ctx;
}
