import { useEffect, useRef, useState } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";

/** Files dropped on the Tauri window, as file system paths (what a desktop app
 * needs to import a folder or open a large file without reading its bytes).
 * Returns whether a drag is over the window, for `FileDropOverlay`. */
export function useTauriFileDrop(onPaths: (paths: string[]) => void, enabled = true): boolean {
  const [active, setActive] = useState(false);
  const cb = useRef(onPaths);
  cb.current = onPaths;

  useEffect(() => {
    if (!enabled) return;
    let unlisten: (() => void) | undefined;
    let gone = false;
    getCurrentWebview()
      .onDragDropEvent(({ payload }) => {
        if (payload.type === "enter" || payload.type === "over") setActive(true);
        else if (payload.type === "leave") setActive(false);
        else if (payload.type === "drop") {
          setActive(false);
          if (payload.paths.length) cb.current(payload.paths);
        }
      })
      .then((u) => (gone ? u() : (unlisten = u)))
      .catch(() => {});
    return () => {
      gone = true;
      unlisten?.();
    };
  }, [enabled]);

  return active;
}
