import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/cn";

export interface AccordionItem {
  id: string;
  title: ReactNode;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Several items may stay open (default: one at a time). */
  multiple?: boolean;
  defaultOpen?: string[];
  className?: string;
}

/** Questions or sections that expand in place, divided by 1px lines. Each
 * title is a real button with `aria-expanded`; the panel is a labelled region. */
export function Accordion({ items, multiple, defaultOpen = [], className }: AccordionProps) {
  const [open, setOpen] = useState<string[]>(defaultOpen);
  const base = useId();
  const toggle = (id: string) => setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : multiple ? [...o, id] : [id]));
  return (
    <div className={cn("border-t border-border", className)}>
      {items.map((it) => {
        const isOpen = open.includes(it.id);
        const trigger = `${base}-${it.id}-t`;
        const panel = `${base}-${it.id}-p`;
        return (
          <div key={it.id} className="border-b border-border">
            <h3 className="m-0">
              <button
                id={trigger}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panel}
                onClick={() => toggle(it.id)}
                className="flex min-h-14 w-full items-center justify-between gap-4 px-1 py-4 text-left text-base font-medium text-text"
              >
                {it.title}
                <ChevronDown size={18} aria-hidden className={cn("flex-none text-text-muted transition-transform duration-200", isOpen && "rotate-180")} />
              </button>
            </h3>
            {isOpen && (
              <div id={panel} role="region" aria-labelledby={trigger} className="max-w-[680px] px-1 pb-5 text-sm leading-[22px] text-text-muted">
                {it.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
