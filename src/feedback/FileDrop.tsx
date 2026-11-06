import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { FileDown, type LucideIcon } from "lucide-react";

export interface UseWindowFileDropOptions {
  /** Called with the dropped files that `accept` let through. */
  onFiles: (files: File[]) => void;
  /** Which files count; default: all. A drag carrying none of them shows no overlay. */
  accept?: (file: { name: string; type: string }) => boolean;
  /** A drop of files that `accept` refused (show a toast). */
  onRejected?: (files: File[]) => void;
  enabled?: boolean;
}

const carriesFiles = (e: DragEvent) => !!e.dataTransfer && [...e.dataTransfer.types].includes("Files");

/** Files dragged anywhere over the window: returns whether a drag is over it,
 * and hands the accepted files on drop. Files never navigate the window, even
 * dropped where nothing takes them. A zone of the page that takes files itself
 * marks itself `data-file-drop-zone` (and calls `preventDefault` on its drop):
 * the window then stays out of the way. In a Tauri app that needs file paths
 * rather than bytes, use `useTauriFileDrop` from "@coresys/cscl-ui/tauri". */
export function useWindowFileDrop({ onFiles, accept, onRejected, enabled = true }: UseWindowFileDropOptions): boolean {
  const [active, setActive] = useState(false);
  const depth = useRef(0);
  const cb = useRef({ onFiles, accept, onRejected });
  cb.current = { onFiles, accept, onRejected };

  useEffect(() => {
    if (!enabled) return;
    const wanted = (e: DragEvent) => {
      if (!carriesFiles(e)) return false;
      const items = [...e.dataTransfer!.items].filter((i) => i.kind === "file");
      // While dragging, only the types are readable, not the names.
      return items.length === 0 || !cb.current.accept || items.some((i) => cb.current.accept!({ name: "", type: i.type }));
    };
    const enter = (e: DragEvent) => {
      if (!wanted(e) || document.querySelector("[data-file-drop-zone]")) return;
      depth.current += 1;
      setActive(true);
    };
    const leave = (e: DragEvent) => {
      if (!carriesFiles(e)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setActive(false);
    };
    const over = (e: DragEvent) => {
      if (carriesFiles(e) && !e.defaultPrevented) e.preventDefault();
    };
    const drop = (e: DragEvent) => {
      depth.current = 0;
      setActive(false);
      if (!carriesFiles(e) || e.defaultPrevented) return;
      e.preventDefault();
      const files = [...e.dataTransfer!.files];
      const ok = cb.current.accept ? files.filter((f) => cb.current.accept!(f)) : files;
      if (ok.length) cb.current.onFiles(ok);
      if (ok.length < files.length) cb.current.onRejected?.(files.filter((f) => !ok.includes(f)));
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragleave", leave);
    window.addEventListener("dragover", over);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("dragover", over);
      window.removeEventListener("drop", drop);
    };
  }, [enabled]);

  return active;
}

export interface FileDropOverlayProps {
  active: boolean;
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
}

/** The full-window "drop to open" target shown while files are dragged over
 * the window: a dashed accent frame over the blurred scrim. Purely visual: pair
 * it with `useWindowFileDrop` (or `useTauriFileDrop`). */
export function FileDropOverlay({ active, title, description, icon: Icon = FileDown }: FileDropOverlayProps) {
  if (!active) return null;
  return createPortal(
    <div className="animate-overlay-in pointer-events-none fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm">
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-accent bg-accent-muted/30 text-center">
        <Icon size={36} strokeWidth={1.5} className="text-accent" />
        <p className="text-base font-medium text-text">{title}</p>
        {description && <p className="text-sm text-text-muted">{description}</p>}
      </div>
    </div>,
    document.body,
  );
}
