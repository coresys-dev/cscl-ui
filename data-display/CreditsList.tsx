import type { ReactNode } from "react";
import { Card } from "../primitives/Card";

export interface CreditsListItem {
  /** Row key — typically the person's name. */
  key: string;
  name: string;
  role: string;
  icon: (props: { className: string }) => ReactNode;
}

export interface CreditsListProps {
  items: CreditsListItem[];
  /** Small uppercase heading above the list, e.g. "Credits". Omit for none. */
  title?: string;
  /** Small centered line below the list, e.g. a copyright notice. */
  footer?: ReactNode;
}

/** "Who did what" block — a settings About tab, a splash credits screen: one
 * card per person with an icon evoking their role, name, and role label. */
export function CreditsList({ items, title, footer }: CreditsListProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {title && <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{title}</p>}
        <div className="space-y-2">
          {items.map(({ key, name, role, icon: Icon }) => (
            <Card key={key} className="flex items-center gap-3 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-muted text-accent">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text">{name}</p>
                <p className="text-xs text-text-muted">{role}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {footer && <p className="text-center text-xs text-text-muted">{footer}</p>}
    </div>
  );
}
