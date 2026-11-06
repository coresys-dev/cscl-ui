import { Fragment, type ReactNode } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: ReactNode;
  /** Absent on the last item (the current page). */
  onClick?: () => void;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  ariaLabel?: string;
}

/** Trail back to where a page was opened from — ported from the CoreSys DS
 * web/app kit (`Breadcrumbs`), with click handlers instead of hrefs (no URL
 * router here). The first item carries a back arrow, as in the app-page mockup. */
export function Breadcrumbs({ items, ariaLabel = "Breadcrumb" }: BreadcrumbsProps) {
  return (
    <nav aria-label={ariaLabel}>
      <ol className="m-0 flex list-none items-center gap-1.5 p-0 text-sm">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <Fragment key={index}>
              {index > 0 && (
                <li aria-hidden="true" className="flex text-text-muted">
                  <ChevronRight size={14} />
                </li>
              )}
              <li className="flex">
                {last ? (
                  <span aria-current="page" className="text-text">
                    {item.label}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={item.onClick}
                    className="flex h-9 items-center gap-1.5 rounded-md pr-1 text-text-muted transition-colors duration-150 hover:text-text"
                  >
                    {index === 0 && <ArrowLeft size={16} aria-hidden="true" />}
                    {item.label}
                  </button>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
