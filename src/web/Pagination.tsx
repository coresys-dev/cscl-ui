import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/cn";
import { pageItems } from "../lib/pages";

export interface PaginationLabels {
  nav: string;
  previous: string;
  next: string;
  /** Accessible name of each page button. */
  page: (n: number) => string;
}

export interface PaginationProps {
  /** Current page, 1-based. */
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  labels?: Partial<PaginationLabels>;
  className?: string;
}

const DEFAULT_LABELS: PaginationLabels = { nav: "Pagination", previous: "Previous", next: "Next", page: (n) => `Page ${n}` };

const step =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-2.5 text-sm text-text-muted transition-colors duration-150 enabled:hover:bg-surface-hover enabled:hover:text-text disabled:cursor-default disabled:opacity-40";
const num = "inline-flex h-9 min-w-9 items-center justify-center rounded-md px-1.5 text-sm tabular-nums transition-colors duration-150";

/** Previous / next with numbered pages and ellipses for long lists. The words
 * hide below 480px of its own width, leaving the chevrons. */
export function Pagination({ page, pageCount, onPageChange, labels, className }: PaginationProps) {
  const l = { ...DEFAULT_LABELS, ...labels };
  return (
    <nav aria-label={l.nav} className={cn("@container flex w-full items-center justify-between gap-2", className)}>
      <button type="button" className={step} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft size={16} />
        <span className="@max-[480px]:hidden">{l.previous}</span>
      </button>
      <ul className="m-0 flex list-none items-center gap-1 p-0">
        {pageItems(page, pageCount).map((n, i) =>
          n === "gap" ? (
            <li key={`gap-${i}`} aria-hidden className="w-6 text-center text-sm text-text-muted">
              …
            </li>
          ) : (
            <li key={n}>
              <button
                type="button"
                aria-label={l.page(n)}
                aria-current={n === page ? "page" : undefined}
                onClick={() => onPageChange(n)}
                className={cn(
                  num,
                  n === page ? "bg-accent-muted text-accent ring-1 ring-inset ring-accent/40" : "text-text-muted hover:bg-surface-hover hover:text-text",
                )}
              >
                {n}
              </button>
            </li>
          ),
        )}
      </ul>
      <button type="button" className={step} disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
        <span className="@max-[480px]:hidden">{l.next}</span>
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
