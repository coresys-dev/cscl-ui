import { useId, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "../lib/cn";

export interface SiteHeaderLink {
  label: string;
  href: string;
  current?: boolean;
}

export interface SiteHeaderLabels {
  menu: string;
  close: string;
  nav: string;
}

export interface SiteHeaderProps {
  /** The logo, usually the horizontal coresys lockup or a product mark wrapped in a link home. */
  brand: ReactNode;
  links?: SiteHeaderLink[];
  /** Buttons on the right (one `primary` at most). */
  actions?: ReactNode;
  /** Sticks 12px from the top of the page (default true). */
  sticky?: boolean;
  labels?: Partial<SiteHeaderLabels>;
  className?: string;
}

const DEFAULT_LABELS: SiteHeaderLabels = { menu: "Menu", close: "Close menu", nav: "Main" };

/** Floating top bar for websites: logo, a few links, one call to action, and a
 * menu button below 720px of its own width (container query). */
export function SiteHeader({ brand, links = [], actions, sticky = true, labels, className }: SiteHeaderProps) {
  const l = { ...DEFAULT_LABELS, ...labels };
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const link = (k: SiteHeaderLink) => (
    <a
      key={k.href}
      href={k.href}
      aria-current={k.current ? "page" : undefined}
      className={cn(
        "inline-flex h-9 items-center rounded-md px-3 text-sm no-underline transition-colors duration-150 hover:bg-surface-hover hover:text-text @max-[720px]:h-11",
        k.current ? "font-medium text-text" : "text-text-muted",
      )}
    >
      {k.label}
    </a>
  );
  return (
    <header
      className={cn(
        "@container z-20 mx-auto w-full max-w-[1200px] rounded-lg border border-border bg-surface py-2 pl-[18px] pr-2 shadow-float",
        sticky && "sticky top-3",
        className,
      )}
    >
      <div className="flex min-h-10 items-center justify-between gap-4">
        <div className="flex flex-none items-center text-text">{brand}</div>
        <nav aria-label={l.nav} className="ml-4 mr-auto flex items-center gap-0.5 @max-[720px]:hidden">
          {links.map(link)}
        </nav>
        <div className="flex flex-none items-center gap-2">
          {actions}
          {links.length > 0 && (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={menuId}
              aria-label={open ? l.close : l.menu}
              onClick={() => setOpen((o) => !o)}
              className="hidden size-10 items-center justify-center rounded-md text-text hover:bg-surface-hover @max-[720px]:inline-flex"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </div>
      {open && (
        <nav id={menuId} aria-label={l.nav} className="mt-2 hidden flex-col gap-0.5 border-t border-border pt-2 @max-[720px]:flex">
          {links.map(link)}
        </nav>
      )}
    </header>
  );
}
