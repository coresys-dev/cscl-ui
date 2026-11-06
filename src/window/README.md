# Window chrome (TitleBar / WindowControls)

Fully custom window chrome, presented as its own floating island. The two
platforms get there differently:

- **Windows / Linux**: `"decorations": false` in `tauri.conf.json`.
  `WindowControls` renders a real minimize / maximize / close trio.
- **macOS**: decorations stay **on**, to keep the window's native rounded
  corners and shadow:
  ```json
  { "titleBarStyle": "Overlay", "hiddenTitle": true }
  ```
  `WindowControls` renders a 72px spacer and reports its rect (CSS pixels,
  ignoring entrance transforms) to `position_traffic_lights` on every layout
  change. The Rust side moves the native traffic lights into that rect and
  re-applies it whenever AppKit lays the title bar out again.

## Required Rust side (macOS)

Without this command the call silently no-ops and the traffic lights stay at
their default top-left position.

**Cargo.toml**

```toml
serde = { version = "1", features = ["derive"] }

[target.'cfg(target_os = "macos")'.dependencies]
objc2 = "0.6"
objc2-foundation = { version = "0.3", features = ["NSGeometry"] }
objc2-app-kit = { version = "0.3", features = ["NSWindow", "NSView", "NSButton", "NSControl", "NSResponder"] }
```

**src/window/mod.rs**

```rust
use std::sync::Mutex;

use serde::Deserialize;
use tauri::{Runtime, State, WebviewWindow};

#[derive(Debug, Clone, Copy, Deserialize, Default)]
#[cfg_attr(not(target_os = "macos"), allow(dead_code))]
pub struct IslandRect {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

/// Last rect the frontend reported, re-applied whenever AppKit lays the title bar out again.
#[derive(Default)]
pub struct TrafficLights(pub Mutex<Option<IslandRect>>);

#[tauri::command]
pub fn position_traffic_lights<R: Runtime>(window: WebviewWindow<R>, state: State<'_, TrafficLights>, rect: IslandRect) {
    *state.0.lock().unwrap_or_else(|e| e.into_inner()) = Some(rect);
    apply(&window, rect);
}

pub fn reapply<R: Runtime>(window: &tauri::Window<R>, state: &TrafficLights) {
    if let Some(rect) = *state.0.lock().unwrap_or_else(|e| e.into_inner()) {
        if let Some(w) = tauri::Manager::get_webview_window(window, window.label()) {
            apply(&w, rect);
        }
    }
}

#[cfg(target_os = "macos")]
fn apply<R: Runtime>(window: &WebviewWindow<R>, rect: IslandRect) {
    let w = window.clone();
    let _ = window.run_on_main_thread(move || {
        if let Ok(ptr) = w.ns_window() {
            // SAFETY: Tauri hands back the live NSWindow of this webview window, on the main thread.
            unsafe { macos::place(ptr, rect) };
        }
    });
}

#[cfg(not(target_os = "macos"))]
fn apply<R: Runtime>(_window: &WebviewWindow<R>, _rect: IslandRect) {}

#[cfg(target_os = "macos")]
mod macos;
```

**src/window/macos.rs**

```rust
use std::ffi::c_void;

use objc2_app_kit::{NSWindow, NSWindowButton, NSWindowStyleMask};
use objc2_foundation::NSPoint;

use super::IslandRect;

pub unsafe fn place(ptr: *mut c_void, rect: IslandRect) {
    let window: &NSWindow = &*(ptr as *const NSWindow);
    if window.styleMask().contains(NSWindowStyleMask::FullScreen) {
        return;
    }
    let (Some(close), Some(mini), Some(zoom)) = (
        window.standardWindowButton(NSWindowButton::CloseButton),
        window.standardWindowButton(NSWindowButton::MiniaturizeButton),
        window.standardWindowButton(NSWindowButton::ZoomButton),
    ) else {
        return;
    };
    let Some(container) = close.superview().and_then(|v| v.superview()) else {
        return;
    };

    // The title bar container spans from the window top down to the island's bottom.
    let window_height = window.frame().size.height;
    let bar_height = rect.y + rect.height;
    let mut frame = container.frame();
    frame.origin.y = window_height - bar_height;
    frame.size.height = bar_height;
    frame.origin.x = 0.0;
    frame.size.width = window.frame().size.width;
    container.setFrame(frame);

    let size = close.frame().size;
    let step = {
        let d = mini.frame().origin.x - close.frame().origin.x;
        if d > size.width && d < 40.0 { d } else { 20.0 }
    };
    let span = step * 2.0 + size.width;
    let x0 = rect.x + (rect.width - span) / 2.0;
    // AppKit's origin is bottom-left: centre the buttons on the island's height.
    let y = (rect.height - size.height) / 2.0;
    for (i, b) in [close, mini, zoom].iter().enumerate() {
        b.setFrameOrigin(NSPoint { x: (x0 + step * i as f64).round(), y: y.round() });
    }
}
```

**src/lib.rs**

```rust
tauri::Builder::default()
    .manage(window::TrafficLights::default())
    .on_window_event(|w, e| {
        if w.label() == "main"
            && matches!(
                e,
                tauri::WindowEvent::Resized(_)
                    | tauri::WindowEvent::ScaleFactorChanged { .. }
                    | tauri::WindowEvent::Focused(_)
                    | tauri::WindowEvent::ThemeChanged(_)
            )
        {
            window::reapply(w, &w.state::<window::TrafficLights>());
        }
    })
    .invoke_handler(tauri::generate_handler![window::position_traffic_lights])
```

Migrating from v1: the command now takes a single `rect` argument
(`{ x, y, width, height }`) instead of four, and `useNativeTrafficLights` is
gone: `WindowControls` reports its own rect.
