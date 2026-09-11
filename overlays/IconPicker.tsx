import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { LUCIDE_ICON_NAMES, resolveLucideIcon } from "../lib/lucideIcons";
import { DEFAULT_COLOR_PALETTE } from "../lib/colorPalette";
import { IconButton } from "../primitives/IconButton";

export interface IconPickerLabels {
  title: string;
  close: string;
  noColor: string;
  noIcon: string;
  searchPlaceholder: string;
  noResults: string;
}

interface IconPickerProps {
  currentIcon: string | null;
  onSelectIcon: (icon: string | null) => void;
  currentColor: string | null;
  onSelectColor: (color: string | null) => void;
  onClose: () => void;
  labels: IconPickerLabels;
  /** Defaults to `DEFAULT_COLOR_PALETTE` — pass your own hues if your app
   * wants a different swatch set. */
  colorPalette?: string[];
}

/** Lucide icon picker: name search + a scrollable grid over the whole
 * library (~1500 icons, no virtualization needed — lightweight `<svg>`s at a
 * reasonable volume), plus a color swatch row. "No icon"/"no color" is
 * always the first cell/swatch, to clear the current selection. */
export function IconPicker({
  currentIcon,
  onSelectIcon,
  currentColor,
  onSelectColor,
  onClose,
  labels,
  colorPalette = DEFAULT_COLOR_PALETTE,
}: IconPickerProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LUCIDE_ICON_NAMES;
    return LUCIDE_ICON_NAMES.filter((name) => name.toLowerCase().includes(q));
  }, [query]);

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="icon-picker-title"
        className="animate-modal-in flex h-[28rem] w-full max-w-md flex-col overflow-hidden rounded-lg border border-border bg-surface p-4 shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <h2 id="icon-picker-title" className="text-sm font-medium text-text">
            {labels.title}
          </h2>
          <IconButton onClick={onClose} aria-label={labels.close} variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="mb-3 flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => onSelectColor(null)}
            title={labels.noColor}
            aria-label={labels.noColor}
            aria-pressed={currentColor === null}
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-text-muted transition-all duration-150 hover:border-accent active:scale-90 ${
              currentColor === null ? "border-accent text-accent" : "border-border"
            }`}
          >
            <X className="h-3 w-3" />
          </button>
          {colorPalette.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onSelectColor(color)}
              title={color}
              aria-label={color}
              aria-pressed={currentColor === color}
              style={{ backgroundColor: color }}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-black/10 transition-transform duration-150 active:scale-90"
            >
              {currentColor === color && <Check className="h-3.5 w-3.5 text-white drop-shadow" />}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={labels.searchPlaceholder}
          autoFocus
          className="optical-center-text mb-3 shrink-0 rounded-md border border-border bg-bg px-3 py-1.5 text-sm text-text outline-none transition-colors focus:border-accent"
        />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-8 gap-1">
            <button
              type="button"
              onClick={() => onSelectIcon(null)}
              title={labels.noIcon}
              aria-label={labels.noIcon}
              className={`flex h-9 w-9 items-center justify-center rounded-md border text-[10px] text-text-muted transition-all duration-150 hover:border-accent hover:text-accent active:scale-90 ${
                currentIcon === null ? "border-accent text-accent" : "border-border"
              }`}
            >
              <X className="h-4 w-4" />
            </button>
            {filtered.map((name) => {
              const Icon = resolveLucideIcon(name);
              if (!Icon) return null;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onSelectIcon(name)}
                  title={name}
                  aria-label={name}
                  className={`flex h-9 w-9 items-center justify-center rounded-md border text-text-muted transition-all duration-150 hover:border-accent hover:text-accent active:scale-90 ${
                    currentIcon === name ? "border-accent text-accent" : "border-border"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <p className="py-6 text-center text-xs text-text-muted">{labels.noResults}</p>
          )}
        </div>
      </div>
    </div>
  );
}
