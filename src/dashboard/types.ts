import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { WidgetSize } from "../lib/grid";

/** The usual shape of one kind of widget in an app's registry: its sizes, its
 * settings and how it renders. `WidgetGrid` doesn't require it; it keeps a
 * catalogue, a settings dialog and stored configs consistent across apps. */
export interface WidgetDef<C = unknown> {
  /** Stable kebab-case identifier, e.g. "recent-projects". */
  kind: string;
  name: string;
  description?: string;
  icon: LucideIcon;
  /** The first size is the default one. */
  sizes: WidgetSize[];
  min: WidgetSize;
  max: WidgetSize;
  defaultConfig: C;
  /** Validates a stored config; returns `defaultConfig` when it is invalid. */
  parse: (raw: unknown) => C;
  Render: (p: { config: C; size: WidgetSize; editing: boolean; setConfig: (c: C) => void }) => ReactNode;
  Settings?: (p: { config: C; onChange: (c: C) => void }) => ReactNode;
}
