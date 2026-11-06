import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronRight, MoreHorizontal, type LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";
import { useOverlayStack } from "./Modal";
import { IconButton } from "../primitives/IconButton";

export type MenuEntry =
  | { type: "item"; key: string; label: string; icon?: LucideIcon; onSelect: () => void; danger?: boolean; disabled?: boolean }
  | { type: "checkbox-item"; key: string; label: string; checked: boolean; onSelect: () => void; disabled?: boolean }
  | { type: "submenu"; key: string; label: string; icon?: LucideIcon; items: MenuEntry[] }
  | { type: "separator"; key: string }
  | { type: "label"; key: string; label: string };

const EDGE = 8;
const ITEMS = "[role=menuitem]:not([disabled]),[role=menuitemcheckbox]:not([disabled])";

export interface MenuProps {
  /** Viewport coordinates of the anchor point (cursor, or a trigger's corner). */
  x: number;
  y: number;
  items: MenuEntry[];
  onClose: () => void;
  /** `"end"`: the menu's right edge sits on `x` (a "⋯" button on the right). */
  align?: "start" | "end";
}

/** One menu engine for both right-click menus and "⋯" dropdowns: icons,
 * section labels, checkboxes, disabled items, one level of submenus, ↑/↓/→/←
 * keyboard navigation, clamped to the viewport, unfurls from its anchor
 * corner. Closes on Escape (top-most overlay only), outside click, scroll or
 * resize. Prefer `useContextMenu` / `DropdownMenu` over mounting it directly. */
export function Menu({ x, y, items, onClose, align = "start" }: MenuProps) {
  useOverlayStack(onClose);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y, visible: false });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let left = align === "end" ? x - r.width : x;
    let top = y;
    left = Math.max(EDGE, Math.min(left, window.innerWidth - r.width - EDGE));
    if (top + r.height > window.innerHeight - EDGE) top = Math.max(EDGE, y - r.height);
    setPos({ left, top, visible: true });
    el.querySelector<HTMLElement>(ITEMS)?.focus();
  }, [x, y, align]);

  useEffect(() => {
    // A scrolling list's own `scroll` doesn't bubble: only the capture phase sees it.
    window.addEventListener("scroll", onClose, true);
    window.addEventListener("resize", onClose);
    return () => {
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-50"
        onMouseDown={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      <div
        ref={ref}
        role="menu"
        style={{ left: pos.left, top: pos.top, visibility: pos.visible ? "visible" : "hidden", transformOrigin: align === "end" ? "top right" : "top left" }}
        className="animate-menu-in fixed z-50 min-w-[200px] max-w-xs rounded-lg border border-border bg-surface p-1 shadow-float"
        onKeyDown={(e) => moveFocus(e, ref.current)}
      >
        <MenuItems items={items} onDone={onClose} />
      </div>
    </>,
    document.body,
  );
}

function moveFocus(e: React.KeyboardEvent, root: HTMLElement | null) {
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
  // Only the items of the menu level the focus is in, not those of an open submenu.
  const list = [...(root?.querySelectorAll<HTMLElement>(ITEMS) ?? [])].filter((el) => el.closest("[role=menu]") === root);
  if (!list.length) return;
  e.preventDefault();
  e.stopPropagation();
  const i = list.indexOf(document.activeElement as HTMLElement);
  const next = e.key === "ArrowDown" ? (i + 1) % list.length : (i - 1 + list.length) % list.length;
  list[next]?.focus();
}

function MenuItems({ items, onDone }: { items: MenuEntry[]; onDone: () => void }) {
  return (
    <>
      {items.map((it) => {
        if (it.type === "separator") return <div key={it.key} role="separator" className="my-1 h-px bg-border" />;
        if (it.type === "label")
          return (
            <p key={it.key} className="px-3 pb-1 pt-1.5 text-xs text-text-muted">
              {it.label}
            </p>
          );
        if (it.type === "submenu") return <Submenu key={it.key} entry={it} onDone={onDone} />;
        const Icon = it.type === "item" ? it.icon : undefined;
        const danger = it.type === "item" && it.danger;
        return (
          <button
            key={it.key}
            type="button"
            role={it.type === "checkbox-item" ? "menuitemcheckbox" : "menuitem"}
            aria-checked={it.type === "checkbox-item" ? it.checked : undefined}
            disabled={it.disabled}
            onClick={() => {
              it.onSelect();
              onDone();
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm outline-none transition-colors duration-150 focus-visible:bg-surface-hover disabled:opacity-50",
              danger ? "text-danger hover:bg-danger/10" : "text-text hover:bg-surface-hover",
            )}
          >
            {it.type === "checkbox-item" && <span className="w-3 shrink-0 text-accent">{it.checked && <Check className="h-3 w-3" />}</span>}
            {Icon && <Icon className={cn("h-3.5 w-3.5 shrink-0", danger ? "text-danger" : "text-text-muted")} />}
            <span className="truncate">{it.label}</span>
          </button>
        );
      })}
    </>
  );
}

function Submenu({ entry, onDone }: { entry: Extract<MenuEntry, { type: "submenu" }>; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState<"right" | "left">("right");
  const Icon = entry.icon;

  useLayoutEffect(() => {
    if (!open || !itemRef.current || !panelRef.current) return;
    const item = itemRef.current.getBoundingClientRect();
    const width = panelRef.current.getBoundingClientRect().width;
    setSide(item.right + width > window.innerWidth - EDGE ? "left" : "right");
  }, [open]);

  const focusFirst = () => requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>(ITEMS)?.focus());

  return (
    <div ref={itemRef} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen(true);
          focusFirst();
        }}
        onKeyDown={(e) => {
          if (e.key !== "ArrowRight") return;
          e.preventDefault();
          setOpen(true);
          focusFirst();
        }}
        className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm text-text outline-none transition-colors duration-150 hover:bg-surface-hover focus-visible:bg-surface-hover"
      >
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-text-muted" />}
        <span className="flex-1 truncate">{entry.label}</span>
        <ChevronRight className="h-3 w-3 shrink-0 text-text-muted" />
      </button>
      {open && (
        <div
          ref={panelRef}
          role="menu"
          className={cn(
            "absolute top-0 min-w-[180px] rounded-lg border border-border bg-surface p-1 shadow-float",
            side === "right" ? "left-full ml-1" : "right-full mr-1",
          )}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
              itemRef.current?.querySelector<HTMLElement>("[aria-haspopup]")?.focus();
              return;
            }
            moveFocus(e, panelRef.current);
          }}
        >
          <MenuItems items={entry.items} onDone={onDone} />
        </div>
      )}
    </div>
  );
}

/** Right-click menu: `onContextMenu={(e) => menu.open(e, items)}`, then render `menu.element`. */
export function useContextMenu() {
  const [state, setState] = useState<{ x: number; y: number; items: MenuEntry[] } | null>(null);
  return {
    open: (e: { clientX: number; clientY: number; preventDefault: () => void; stopPropagation?: () => void }, items: MenuEntry[]) => {
      e.preventDefault();
      e.stopPropagation?.();
      setState({ x: e.clientX, y: e.clientY, items });
    },
    close: () => setState(null),
    element: state ? <Menu x={state.x} y={state.y} items={state.items} onClose={() => setState(null)} /> : null,
  };
}

export interface DropdownMenuProps {
  items: MenuEntry[];
  /** Accessible name of the default "⋯" trigger. */
  label?: string;
  /** Custom trigger: call `open` from its click handler. */
  trigger?: (open: (e: ReactMouseEvent<HTMLElement>) => void) => ReactNode;
  /** Which edge of the trigger the menu lines up with. */
  align?: "start" | "end";
  className?: string;
}

/** "⋯" overflow menu anchored under a trigger button. */
export function DropdownMenu({ items, label = "More actions", trigger, align = "end", className }: DropdownMenuProps) {
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const open = (e: ReactMouseEvent<HTMLElement>) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    setAt({ x: align === "end" ? r.right : r.left, y: r.bottom + 4 });
  };
  return (
    <>
      {trigger ? (
        trigger(open)
      ) : (
        <IconButton aria-label={label} onClick={open} className={className}>
          <MoreHorizontal />
        </IconButton>
      )}
      {at && <Menu x={at.x} y={at.y} items={items} onClose={() => setAt(null)} align={align} />}
    </>
  );
}
