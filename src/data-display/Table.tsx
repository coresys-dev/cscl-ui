import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface TableColumn<T> {
  key: string;
  label: ReactNode;
  align?: "left" | "right" | "center";
  width?: number | string;
  render?: (row: T) => ReactNode;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  getRowId?: (row: T, index: number) => string | number;
  /** Accessible name (rendered visually hidden — the page carries its own heading). */
  caption?: string;
  emptyLabel?: ReactNode;
  dense?: boolean;
  className?: string;
}

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" } as const;

/** Data table — ported from the CoreSys DS web/app kit (`Table`), without
 * sorting: a `radius-lg` `surface` frame that scrolls sideways inside itself,
 * headers in the uppercase `label` style. */
export function Table<T>({ columns, rows, getRowId, caption, emptyLabel, dense, className }: TableProps<T>) {
  const cell = dense ? "px-3 py-2" : "px-4 py-3";
  return (
    <div className={cn("overflow-x-auto rounded-lg border border-border bg-surface", className)}>
      <table className="w-full min-w-[640px] border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={{ width: col.width }}
                className={cn(cell, "border-b border-border text-xs font-medium uppercase tracking-wide text-text-muted", ALIGN[col.align ?? "left"])}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={cn(cell, "text-center text-xs text-text-muted")}>
                {emptyLabel}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={getRowId?.(row, index) ?? (row as { id?: string | number }).id ?? index} className="group">
                {columns.map((col) => (
                  <td key={col.key} className={cn(cell, "border-b border-border group-last:border-b-0", ALIGN[col.align ?? "left"])}>
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
