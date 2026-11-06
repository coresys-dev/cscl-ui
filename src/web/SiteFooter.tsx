import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export interface SiteFooterProps {
  brand: ReactNode;
  tagline?: ReactNode;
  columns?: FooterColumn[];
  /** Optional oversized logotype drawn in `color-surface-raised` across the footer. */
  wordmark?: ReactNode;
  legal: ReactNode;
  meta?: ReactNode;
  className?: string;
}

/** The end of a web page: brand and tagline, columns of links, legal line. */
export function SiteFooter({ brand, tagline, columns, wordmark, legal, meta, className }: SiteFooterProps) {
  return (
    <footer className={cn("flex flex-col text-text", className)}>
      <div className="flex flex-wrap justify-between gap-10 border-t border-border pb-8 pt-12">
        <div className="flex max-w-[320px] flex-col gap-2.5">
          {brand}
          {tagline && <p className="m-0 text-[13px] leading-5 text-text-muted">{tagline}</p>}
        </div>
        {columns && columns.length > 0 && (
          <div className="flex flex-wrap gap-12">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="m-0 mb-3 text-xs font-medium uppercase tracking-[0.025em] text-text-muted">{col.title}</h3>
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} className="rounded-sm text-sm text-text-muted no-underline transition-colors duration-150 hover:text-text">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
      {wordmark && (
        <div aria-hidden className="mb-6 mt-2 text-surface-raised [&>svg]:block [&>svg]:h-auto [&>svg]:w-full">
          {wordmark}
        </div>
      )}
      <div className="flex flex-wrap justify-between gap-3 border-t border-border pb-7 pt-5 text-xs text-text-muted">
        <span>{legal}</span>
        {meta && <span>{meta}</span>}
      </div>
    </footer>
  );
}
