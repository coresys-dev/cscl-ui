import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, ChevronRight } from "lucide-react";

export type MenuEntry =
  | { type: "item"; key: string; label: string; onSelect: () => void; danger?: boolean }
  | { type: "checkbox-item"; key: string; label: string; checked: boolean; onSelect: () => void }
  | { type: "separator"; key: string }
  | { type: "submenu"; key: string; label: string; items: MenuEntry[] };

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuEntry[];
  onClose: () => void;
}

const MENU_PADDING = 8;

/** Generic context menu positioned at the right-click coordinates, clamped
 * to the screen edges, closed on outside click / Escape / scroll. Scroll is
 * captured in the capture phase on `window`: a scrollable list's own
 * `scroll` event doesn't bubble, only the capture phase sees it pass. */
export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y, visible: false });

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const clampedX = Math.min(x, window.innerWidth - rect.width - MENU_PADDING);
    const clampedY = Math.min(y, window.innerHeight - rect.height - MENU_PADDING);
    setPosition({ x: Math.max(MENU_PADDING, clampedX), y: Math.max(MENU_PADDING, clampedY), visible: true });
  }, [x, y]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onClose, true);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  return (
    <div
      ref={rootRef}
      role="menu"
      style={{ left: position.x, top: position.y, visibility: position.visible ? "visible" : "hidden" }}
      className="animate-modal-in fixed z-50 min-w-[200px] rounded-lg border border-border bg-surface p-1 shadow-float"
    >
      {items.map((entry) => (
        <MenuEntryView key={entry.key} entry={entry} onDone={onClose} />
      ))}
    </div>
  );
}

function MenuEntryView({ entry, onDone }: { entry: MenuEntry; onDone: () => void }) {
  if (entry.type === "separator") {
    return <div role="separator" className="my-1 h-px bg-border" />;
  }

  if (entry.type === "submenu") {
    return <SubmenuItem label={entry.label} items={entry.items} onDone={onDone} />;
  }

  const checked = entry.type === "checkbox-item" ? entry.checked : undefined;

  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        entry.onSelect();
        onDone();
      }}
      className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm transition-colors duration-100 ${
        entry.type === "item" && entry.danger
          ? "text-danger hover:bg-danger/10"
          : "text-text hover:bg-surface-hover"
      }`}
    >
      {checked !== undefined && (
        <span className="w-3 shrink-0 text-accent">{checked && <Check className="h-3 w-3" />}</span>
      )}
      <span className="truncate">{entry.label}</span>
    </button>
  );
}

function SubmenuItem({ label, items, onDone }: { label: string; items: MenuEntry[]; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState<"right" | "left">("right");

  useLayoutEffect(() => {
    if (!open || !itemRef.current || !panelRef.current) return;
    const itemRect = itemRef.current.getBoundingClientRect();
    const panelWidth = panelRef.current.getBoundingClientRect().width;
    setSide(itemRect.right + panelWidth > window.innerWidth - MENU_PADDING ? "left" : "right");
  }, [open]);

  return (
    <div
      ref={itemRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-1.5 text-left text-sm text-text transition-colors duration-100 hover:bg-surface-hover"
      >
        <span className="truncate">{label}</span>
        <span className="text-text-muted">
          <ChevronRight className="h-3 w-3" />
        </span>
      </button>
      {open && (
        <div
          ref={panelRef}
          role="menu"
          className={`absolute top-0 min-w-[180px] rounded-lg border border-border bg-surface p-1 shadow-float ${
            side === "right" ? "left-full ml-1" : "right-full mr-1"
          }`}
        >
          {items.map((entry) => (
            <MenuEntryView key={entry.key} entry={entry} onDone={onDone} />
          ))}
        </div>
      )}
    </div>
  );
}
