import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Card } from "../primitives/Card";
import { cn } from "../lib/cn";

/** One log line. `level` is a free-form string rather than a closed union so
 * host apps can define their own severity vocabulary — `LogConsole` only
 * special-cases the literal strings `"warn"` and `"error"` for color/filter
 * ranking, anything else renders with the default (muted) color and ranks
 * below `"warn"`. */
export interface LogLine {
  level: string;
  message: string;
  /** Optional prefix rendered before the message, e.g. a subsystem/source
   * name. Omit for a plain "timestamp + message" line. */
  source?: string;
  /** Epoch ms. Omitted lines just don't show a time column. */
  timestamp?: number;
}

const LEVEL_TEXT: Record<string, string> = {
  info: "text-text-muted",
  warn: "text-warning",
  error: "text-danger",
};

/** Rank of the built-in levels for the "this level and above" filter; any
 * level not in this table ranks as `0` (same as `"info"`). */
const LEVEL_RANK: Record<string, number> = { info: 0, warn: 1, error: 2 };

const BTN =
  "shrink-0 rounded-md border border-border bg-surface-hover px-2.5 py-1 text-xs text-text transition-all duration-150 hover:border-accent hover:text-accent active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60";
const SELECT =
  "rounded-md border border-border bg-surface-raised px-2 py-1 text-xs text-text outline-none transition-colors hover:text-text focus:border-accent";
const INPUT =
  "min-w-0 flex-1 rounded-md border border-border bg-surface-raised px-2 py-1 text-xs text-text outline-none transition-colors focus:border-accent";

function formatTime(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function formatLine(l: LogLine): string {
  const ts = l.timestamp !== undefined ? new Date(l.timestamp).toISOString() : "";
  return [ts, l.level.toUpperCase(), l.source, l.message].filter(Boolean).join("  ");
}

interface LogConsoleLabels {
  title: string;
  /** e.g. "42 lines" — computed by the caller so this stays free of
   * pluralization/i18n concerns. */
  lineCount: string;
  subtitle?: string;
  filterPlaceholder: string;
  levelAll: string;
  levelWarn: string;
  levelError: string;
  copy: string;
  copied: string;
  clear: string;
  openFile: string;
  empty: string;
  noMatch: string;
}

interface LogConsoleProps {
  lines: LogLine[];
  labels: LogConsoleLabels;
  /** Clears whatever store `lines` is read from. */
  onClear: () => void;
  /** Opens the on-disk log file, if there is one — omit to hide the button. */
  onOpenFile?: () => void;
  className?: string;
}

/** Collapsible, filterable log console: closed by default, auto-opens itself
 * the first time an `"error"`-level line appears (only once — reopening
 * later is manual). Text filter matches `message`/`source`; the level select
 * is a "this level and above" floor. Copy copies the currently-filtered lines
 * as plain text (`timestamp  LEVEL  source: message` per line); clear and
 * open-file are both delegated to the caller since the underlying log store
 * and file are host-specific. */
export function LogConsole({ lines, labels, onClear, onOpenFile, className }: LogConsoleProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [minLevel, setMinLevel] = useState("info");
  const [copied, setCopied] = useState(false);

  const autoOpened = useRef(false);
  const hasError = lines.some((l) => l.level === "error");
  useEffect(() => {
    if (hasError && !autoOpened.current) {
      autoOpened.current = true;
      setOpen(true);
    }
  }, [hasError]);

  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const floor = LEVEL_RANK[minLevel] ?? 0;
    return lines.filter((l) => {
      if ((LEVEL_RANK[l.level] ?? 0) < floor) return false;
      if (!needle) return true;
      return l.message.toLowerCase().includes(needle) || (l.source ?? "").toLowerCase().includes(needle);
    });
  }, [lines, filter, minLevel]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [visible, open]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
  }

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(visible.map(formatLine).join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <Card className={cn("space-y-2 p-3", className)}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-1.5 text-left">
        <ChevronRight
          className={cn("h-3.5 w-3.5 shrink-0 text-text-muted transition-transform", open && "rotate-90")}
        />
        <span className="text-sm font-medium text-text">{labels.title}</span>
        <span className="text-xs text-text-muted">· {labels.lineCount}</span>
        {hasError && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />}
      </button>

      {open && (
        <>
          {labels.subtitle && <p className="text-xs text-text-muted">{labels.subtitle}</p>}

          <div className="flex flex-wrap items-center gap-1.5">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={labels.filterPlaceholder}
              className={INPUT}
            />
            <select value={minLevel} onChange={(e) => setMinLevel(e.target.value)} className={SELECT}>
              <option value="info">{labels.levelAll}</option>
              <option value="warn">{labels.levelWarn}</option>
              <option value="error">{labels.levelError}</option>
            </select>
            <button type="button" onClick={copyAll} className={BTN} disabled={visible.length === 0}>
              {copied ? labels.copied : labels.copy}
            </button>
            <button type="button" onClick={onClear} className={BTN} disabled={lines.length === 0}>
              {labels.clear}
            </button>
            {onOpenFile && (
              <button type="button" onClick={onOpenFile} className={BTN}>
                {labels.openFile}
              </button>
            )}
          </div>

          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="h-60 overflow-y-auto rounded-md border border-border bg-surface-sunken p-2 font-mono text-[11px] leading-relaxed"
          >
            {visible.length === 0 ? (
              <p className="text-xs text-text-muted">{lines.length === 0 ? labels.empty : labels.noMatch}</p>
            ) : (
              visible.map((l, i) => (
                <div key={`${l.timestamp ?? ""}-${i}`} className="whitespace-pre-wrap break-words">
                  {l.timestamp !== undefined && <span className="text-text-subtle">{formatTime(l.timestamp)} </span>}
                  {l.source && <span className="text-text-subtle">{l.source} </span>}
                  <span className={LEVEL_TEXT[l.level] ?? "text-text-muted"}>{l.message}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </Card>
  );
}
