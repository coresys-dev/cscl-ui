# SyncLinkProvider

Tracks a CORE-wide "SyncLink" state: whether CORE is currently driving this
app's theme and language centrally. Generic CoreSys-wide infra — every
CoreSys app that wants to participate in CORE's cross-app theme/language sync
needs to listen for it identically, which is why this lives as shared
provider rather than something each app reimplements.

The frontend piece (`SyncLinkProvider.tsx`) is close to a verbatim port of
SLDR's; what's app-specific is entirely on the Rust side.

## Required Rust-side contract

Your app's Tauri backend needs to expose two things:

1. **A command** (default name expected by this component:
   `get_synclink_status`) that returns the current status synchronously from
   in-memory state:

   ```rust
   #[derive(serde::Serialize, Clone, Copy, PartialEq, Eq, Default)]
   #[serde(rename_all = "camelCase")]
   pub struct SyncLinkStatus {
       pub synced: bool,
   }

   #[tauri::command]
   pub fn get_synclink_status(state: tauri::State<AppState>) -> SyncLinkStatus {
       *state.synclink_status.lock().unwrap()
   }
   ```

   Register it in your `tauri::generate_handler![...]` list. If your app
   registers it under a different command name, pass `getStatusCommand` to
   `<SyncLinkProvider>` to match.

2. **An event** (default name expected by this component:
   `synclink://state`) emitted every time the status changes:

   ```rust
   app.emit("synclink://state", next_status)?;
   ```

   If your app emits it under a different event name, pass `eventName` to
   `<SyncLinkProvider>` to match.

## What your backend must actually do with a synced value

SyncLink is one-directional: CORE is the sole source of truth, the app never
writes back to it. When your backend receives a sync snapshot from CORE
(discovery + connection handling is out of scope for this doc — see SLDR's
`src/src/synclink/` module, which can be copied close to verbatim, for a
working reference implementation of discovery/backoff/protocol handling):

- If the snapshot says sync is disabled, or the app's current persisted
  theme/locale already match it, do nothing (no settings-file write, no
  event) — avoid writing the settings file for a no-op change.
- Otherwise, **persist** the incoming theme/locale to your app's own
  settings file yourself, *then* emit the event. The frontend's `onSync`
  callback fires only after that write has already happened — its job is to
  re-read the app's own settings (or otherwise react to the fact that they
  changed), not to receive the theme/locale values directly. This is why
  `SyncLinkStatus` here only carries `synced: boolean` and nothing else: the
  values themselves flow through your app's normal settings-persistence
  path, not through this status payload.

## Frontend usage

```tsx
<SyncLinkProvider onSync={() => void refreshMySettings()}>
  <App />
</SyncLinkProvider>
```

Read `useSyncLink().synced` anywhere under the provider to freeze/disable
theme and language controls while CORE is driving them.
