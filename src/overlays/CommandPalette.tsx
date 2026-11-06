import { useMemo, useRef, useState, type ReactNode } from "react";
import { Search, type LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";
import { Kbd } from "../primitives/Kbd";
import { Modal } from "./Modal";

export interface CommandItem {
  key: string;
  label: string;
  /** Right-aligned detail: a date, a parent's name, a shortcut. */
  hint?: ReactNode;
  icon?: LucideIcon;
  /** A thumbnail URL shown instead of an icon (a project cover). */
  thumb?: string | null;
  /** Anything at the far end, e.g. a status `Badge`. */
  badge?: ReactNode;
  run: () => void;
}

export interface CommandGroup {
  title: string;
  items: CommandItem[];
}

export interface CommandPaletteLabels {
  placeholder: string;
  search: string;
  results: string;
  noResults: string;
  escape: string;
}

export interface CommandPaletteProps {
  /** The groups for the current query, already filtered and ordered by the app. Empty groups are skipped. */
  groups: (query: string) => CommandGroup[];
  onClose: () => void;
  labels?: Partial<CommandPaletteLabels>;
}

const DEFAULT_LABELS: CommandPaletteLabels = {
  placeholder: "Search or run a command",
  search: "Search",
  results: "Results",
  noResults: "No results",
  escape: "Esc",
};

/** The ⌘K palette: a search field over grouped results (recent items, documents,
 * actions), each with an icon or a thumbnail, a hint and a badge. ↑ ↓ move,
 * Enter runs, Escape closes. The palette closes before running the item. */
export function CommandPalette({ groups, onClose, labels }: CommandPaletteProps) {
  const l = { ...DEFAULT_LABELS, ...labels };
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const list = useRef<HTMLDivElement>(null);
  const shown = useMemo(() => groups(q).filter((g) => g.items.length > 0), [groups, q]);
  const flat = shown.flatMap((g) => g.items);
  const current = Math.min(active, Math.max(flat.length - 1, 0));
  const run = (item?: CommandItem) => {
    if (!item) return;
    onClose();
    item.run();
  };
  const move = (d: number) => {
    const next = (current + d + flat.length) % Math.max(flat.length, 1);
    setActive(next);
    list.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" });
  };

  let i = -1;
  return (
    <Modal onClose={onClose} className="mt-[8vh] max-w-xl self-start p-0" labelledBy="command-palette-input">
      <div className="flex items-center gap-2 border-b border-border px-4">
        <Search size={16} className="shrink-0 text-text-muted" />
        <input
          id="command-palette-input"
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              move(1);
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              move(-1);
            }
            if (e.key === "Enter") {
              e.preventDefault();
              run(flat[current]);
            }
          }}
          placeholder={l.placeholder}
          aria-label={l.search}
          role="combobox"
          aria-expanded
          aria-controls="command-palette-list"
          aria-activedescendant={flat.length ? `command-palette-${current}` : undefined}
          className="h-12 min-w-0 flex-1 bg-transparent text-base text-text outline-none placeholder:text-text-muted"
        />
        <Kbd keys={[l.escape]} />
      </div>
      <div ref={list} id="command-palette-list" className="max-h-[min(60vh,28rem)] overflow-y-auto p-1" role="listbox" aria-label={l.results}>
        {flat.length === 0 && <p className="px-3 py-6 text-center text-xs text-text-muted">{l.noResults}</p>}
        {shown.map((g) => (
          <div key={g.title} role="group" aria-label={g.title} className="pb-1">
            <p className="px-3 pb-1 pt-2 text-xs text-text-muted">{g.title}</p>
            {g.items.map((item) => {
              i += 1;
              const idx = i;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  id={`command-palette-${idx}`}
                  type="button"
                  role="option"
                  aria-selected={idx === current}
                  data-index={idx}
                  tabIndex={-1}
                  onMouseMove={() => setActive(idx)}
                  onClick={() => run(item)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-text transition-colors duration-150",
                    idx === current && "bg-surface-hover",
                  )}
                >
                  {Icon ? (
                    <Icon size={16} className="shrink-0 text-text-muted" />
                  ) : item.thumb !== undefined ? (
                    <span className="h-6 w-10 shrink-0 overflow-hidden rounded-sm border border-border bg-surface-raised">
                      {item.thumb && <img src={item.thumb} alt="" className="h-full w-full object-cover" draggable={false} />}
                    </span>
                  ) : (
                    <span className="w-4 shrink-0" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.hint && <span className="shrink-0 text-xs text-text-muted">{item.hint}</span>}
                  {item.badge}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </Modal>
  );
}
