import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Copy, Minus, Square, X } from "lucide-react";
import { cn } from "../lib/cn";
import { isMacOS } from "../lib/platform";

/** Width reserved in the island for macOS's native traffic lights. */
export const TRAFFIC_LIGHTS_WIDTH = 72;

export interface WindowControlsLabels {
  minimize: string;
  maximize: string;
  restore: string;
  close: string;
}

const DEFAULT_LABELS: WindowControlsLabels = { minimize: "Minimize", maximize: "Maximize", restore: "Restore", close: "Close" };

/** Layout position, ignoring any entrance transform on an ancestor (the island animates in). */
function layoutRect(el: HTMLElement) {
  let x = 0;
  let y = 0;
  for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) {
    x += n.offsetLeft;
    y += n.offsetTop;
  }
  return { x, y, width: el.offsetWidth, height: el.offsetHeight };
}

/** Window chrome for a borderless Tauri window. Slots into whatever bar
 * already exists (a drag strip, a tab bar) rather than drawing its own row.
 *
 * - Windows/Linux (`decorations: false`): a minimize / maximize / close trio.
 * - macOS (`titleBarStyle: "Overlay"`): a spacer whose rect is reported to the
 *   `position_traffic_lights` command on every layout change, so the native
 *   traffic lights sit exactly inside it (see `window/README.md`). */
export function WindowControls({ labels, className }: { labels?: Partial<WindowControlsLabels>; className?: string }) {
  const l = { ...DEFAULT_LABELS, ...labels };
  const spacer = useRef<HTMLDivElement>(null);
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!isMacOS) return;
    let frame = 0;
    const report = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (spacer.current) void invoke("position_traffic_lights", { rect: layoutRect(spacer.current) }).catch(() => {});
      });
    };
    report();
    const ro = new ResizeObserver(report);
    ro.observe(document.documentElement);
    if (spacer.current) ro.observe(spacer.current);
    window.addEventListener("resize", report);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("resize", report);
    };
  }, []);

  useEffect(() => {
    if (isMacOS) return;
    const w = getCurrentWindow();
    let unlisten: (() => void) | undefined;
    let gone = false;
    w.isMaximized()
      .then(setMaximized)
      .catch(() => {});
    w.onResized(() => {
      w.isMaximized()
        .then(setMaximized)
        .catch(() => {});
    }).then((u) => (gone ? u() : (unlisten = u)));
    return () => {
      gone = true;
      unlisten?.();
    };
  }, []);

  if (isMacOS) return <div ref={spacer} aria-hidden style={{ width: TRAFFIC_LIGHTS_WIDTH }} className={cn("shrink-0", className)} />;

  const w = getCurrentWindow();
  const btn = "flex w-11 items-center justify-center text-text-muted transition-colors hover:bg-surface-hover hover:text-text";
  return (
    <div className={cn("flex select-none items-stretch", className)}>
      <button type="button" aria-label={l.minimize} title={l.minimize} onClick={() => w.minimize()} className={btn}>
        <Minus size={14} />
      </button>
      <button
        type="button"
        aria-label={maximized ? l.restore : l.maximize}
        title={maximized ? l.restore : l.maximize}
        onClick={() => w.toggleMaximize()}
        className={btn}
      >
        {maximized ? <Copy size={13} className="-scale-x-100" /> : <Square size={12} />}
      </button>
      <button
        type="button"
        aria-label={l.close}
        title={l.close}
        onClick={() => w.close()}
        className="flex w-11 items-center justify-center text-text-muted transition-colors hover:bg-danger hover:text-white"
      >
        <X size={14} />
      </button>
    </div>
  );
}
