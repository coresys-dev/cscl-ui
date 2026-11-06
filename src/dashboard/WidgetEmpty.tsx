import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/** The compact EmptyState of a widget: same look as the full one, sized for a card. `compact` drops the icon and the description (a short card). */
export function WidgetEmpty({
  icon: Icon,
  title,
  description,
  action,
  compact,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-2 overflow-hidden p-3 text-center">
      {!compact && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-muted">
          <Icon size={18} strokeWidth={1.75} />
        </div>
      )}
      <p className="text-sm font-medium text-text">{title}</p>
      {description && !compact && <p className="max-w-xs text-xs text-text-muted">{description}</p>}
      {action}
    </div>
  );
}
