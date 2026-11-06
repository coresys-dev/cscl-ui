import { forwardRef, useEffect, useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { Copy, GripVertical, MoveDiagonal2, Settings2, Trash2, X } from "lucide-react";
import { cn } from "../lib/cn";
import type { Box } from "../lib/grid";
import { Card } from "../primitives/Card";
import { IconButton } from "../primitives/IconButton";
import { DropdownMenu } from "../overlays/Menu";
import { useWidgetOverflow } from "./useWidgetOverflow";

export interface WidgetFrameLabels {
  move: (name: string) => string;
  resize: (name: string) => string;
  settings: (name: string) => string;
  actions: (name: string) => string;
  remove: (name: string) => string;
  duplicate: string;
  removeAction: string;
}

/** What a widget's card offers while the dashboard is being edited. */
export interface FrameEdit {
  /** The id of the line that explains the gestures, read with the card's name. */
  hintId: string;
  /** Being dragged or resized: drawn above the others. */
  lifted: boolean;
  onMoveDown: (e: PointerEvent) => void;
  onResizeDown: (e: PointerEvent) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  onRemove: () => void;
  onDuplicate?: () => void;
  canDuplicate: boolean;
  onSettings?: () => void;
  labels: WidgetFrameLabels;
}

/** One widget's card, placed on the grid at its cells. While editing it is a
 * handle (focus selects it, the keyboard moves it), its content takes no pointer
 * and no focus, and its tools sit over it. */
export const WidgetFrame = forwardRef<HTMLDivElement, { box: Box; label: string; edit?: FrameEdit | null; children: ReactNode }>(function WidgetFrame(
  { box, label, edit, children },
  ref,
) {
  const content = useRef<HTMLDivElement | null>(null);
  const overflow = useWidgetOverflow();
  const editing = !!edit;
  // Nothing inside a widget can be reached while editing, by pointer or by Tab.
  useEffect(() => {
    content.current?.toggleAttribute("inert", editing);
  }, [editing]);

  return (
    <div
      ref={ref}
      data-widget-id={box.id}
      className={cn("relative min-h-0 min-w-0", edit?.lifted && "z-20")}
      style={{ gridColumn: `${box.x + 1} / span ${box.w}`, gridRow: `${box.y + 1} / span ${box.h}` }}
    >
      <Card
        role="group"
        aria-label={label}
        aria-describedby={edit?.hintId}
        tabIndex={edit ? 0 : undefined}
        className={cn(
          "relative h-full overflow-hidden",
          edit && "cursor-grab touch-none select-none outline-none ring-1 ring-border transition-shadow focus:ring-2 focus:ring-accent/60",
          edit?.lifted && "cursor-grabbing opacity-95 shadow-float",
        )}
        onPointerDown={
          edit
            ? (e) => {
                // A tool (a button, the menu in its portal) is not the handle.
                if (!e.currentTarget.contains(e.target as Node) || (e.target as HTMLElement).closest("button")) return;
                e.currentTarget.focus({ preventScroll: true });
                edit.onMoveDown(e);
              }
            : undefined
        }
        onKeyDown={edit ? (e) => e.target === e.currentTarget && edit.onKeyDown(e) : undefined}
      >
        <div
          ref={(el) => {
            content.current = el;
            overflow(el);
          }}
          className={cn("widget-content h-full", edit && "pointer-events-none")}
        >
          {children}
        </div>
        {edit && <EditTools edit={edit} label={label} />}
      </Card>
    </div>
  );
});

function EditTools({ edit, label }: { edit: FrameEdit; label: string }) {
  const l = edit.labels;
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-1">
        <span
          aria-hidden
          title={l.move(label)}
          className="pointer-events-auto flex h-7 w-7 cursor-grab items-center justify-center rounded-md bg-surface/90 text-text-muted shadow-card hover:text-text"
        >
          <GripVertical size={14} strokeWidth={1.75} />
        </span>
        <div className="pointer-events-auto flex items-center gap-0.5 rounded-md bg-surface/90 p-0.5 shadow-card">
          {edit.onSettings && (
            <IconButton aria-label={l.settings(label)} className="h-7 w-7" onClick={edit.onSettings}>
              <Settings2 />
            </IconButton>
          )}
          {edit.onDuplicate && (
            <DropdownMenu
              label={l.actions(label)}
              className="h-7 w-7"
              items={[
                { type: "item", key: "duplicate", label: l.duplicate, icon: Copy, onSelect: edit.onDuplicate, disabled: !edit.canDuplicate },
                { type: "item", key: "remove", label: l.removeAction, icon: Trash2, onSelect: edit.onRemove, danger: true },
              ]}
            />
          )}
          <IconButton aria-label={l.remove(label)} className="h-7 w-7" onClick={edit.onRemove}>
            <X />
          </IconButton>
        </div>
      </div>
      {/* The keyboard resizes with Shift and the arrows: this handle is for the pointer only. */}
      <span
        aria-hidden
        title={l.resize(label)}
        className="absolute bottom-0.5 right-0.5 flex h-6 w-6 cursor-nwse-resize touch-none items-center justify-center rounded-md bg-surface/90 text-text-muted shadow-card hover:text-text"
        onPointerDown={edit.onResizeDown}
      >
        <MoveDiagonal2 size={13} strokeWidth={1.75} />
      </span>
    </>
  );
}
