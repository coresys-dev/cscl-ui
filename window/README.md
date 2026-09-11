# Window chrome (TitleBar / WindowControls)

Fully custom window chrome, never mixed with native decorations — one
reconstructed control cluster (minimize/maximize/close), always presented as
its own floating island. The two platforms get there differently:

- **Windows/Linux**: `"decorations": false` in `tauri.conf.json`. Fully
  custom — `WindowControls` renders a real minimize/maximize/close trio.
- **macOS**: decorations stay **on**, specifically to keep the window's
  native rounded corners and drop shadow (a fully undecorated window loses
  those on macOS):
  ```json
  { "titleBarStyle": "Overlay", "hiddenTitle": true }
  ```
  `WindowControls` renders nothing but a spacer on macOS — the *native*
  traffic-light buttons are kept, just repositioned to land inside the same
  floating island rectangle the JS side renders, via `useNativeTrafficLights`
  (reports the island's screen rect every render/resize) and a Rust-side
  `position_traffic_lights` command.

## Required Rust-side command (macOS only)

Every consuming app needs this command registered, or `useNativeTrafficLights`
silently no-ops on macOS and the native traffic lights stay in their default
top-left position instead of tracking the island.

**Cargo.toml** (macOS-only natively, but these lines are harmless to leave
unconditional in Cargo.toml itself — only the Rust code needs `#[cfg(target_os = "macos")]`):
```toml
cocoa = "0.25"
objc = "0.2"
```

**A command wrapper**, exposed to the frontend and registered in your
`tauri::generate_handler![...]` list:
```rust
#[tauri::command]
pub fn position_traffic_lights(window: tauri::WebviewWindow, x: f64, y: f64, width: f64, height: f64) {
    #[cfg(target_os = "macos")]
    crate::macos::position_traffic_lights(&window, x, y, width, height);
    #[cfg(not(target_os = "macos"))]
    let _ = (window, x, y, width, height);
}
```

**The actual repositioning logic** (`src/macos.rs` in SLDR) reads the
window's native traffic-light buttons via `NSWindow`/`objc` and moves them to
sit centered inside the reported DOM rect, converting from the DOM's
top-left-origin coordinates to AppKit's bottom-left-origin local coordinates.
Copy this module verbatim from SLDR (`src/src/macos.rs`) — it has no
SLDR-specific logic, purely window-button geometry.

## tauri.conf.json per-platform overrides

Split your window config per platform (`tauri.macos.conf.json` /
`tauri.windows.conf.json`, merged over the base `tauri.conf.json` by the
Tauri CLI) so macOS gets `titleBarStyle`/`hiddenTitle` and Windows/Linux gets
`decorations: false` — don't put both in the base config.

## Components

- **`WindowControls`** — the reconstructed minimize/maximize/close trio
  (Windows/Linux) or a spacer reserving the native traffic-lights' width
  (macOS). Exports `isMacOS` (platform check) for anything else that needs
  to branch on it, like `TitleBar` itself.
- **`TitleBar`** — the floating island housing `WindowControls`, meant to sit
  in normal document flow above your main content column. Pass
  `mergedElsewhere` when another bar (e.g. a browser-style tab bar) already
  hosts this same island at its own height, so this one disappears entirely
  instead of leaving an empty strip. Pass `revealed` if your app has a
  startup reveal sequence and wants the island to wait for it (see
  theme/motion.css's `.animate-chrome-in`).
