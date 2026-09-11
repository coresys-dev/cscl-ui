import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { InlineRenameInput } from "./InlineRenameInput";

interface ListRowProps {
  selected: boolean;
  /** While true, renders an `InlineRenameInput` instead of `children`. */
  renaming?: boolean;
  /** Initial text for the rename field — required whenever `renaming` can be true. */
  renameValue?: string;
  onRenameSubmit?: (value: string) => void;
  onRenameCancel?: () => void;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}

/** Generic selectable row wrapper: owns selection styling, click/context-menu
 * wiring, and swapping to an `InlineRenameInput` while `renaming` is true.
 * The row's actual visual content (icon, label, waveform, metadata columns,
 * whatever) is entirely the caller's via `children` — this component never
 * renders anything domain-specific itself. */
export function ListRow({
  selected,
  renaming,
  renameValue,
  onRenameSubmit,
  onRenameCancel,
  onClick,
  onContextMenu,
  className,
  style,
  children,
}: ListRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={renaming ? undefined : onClick}
      onKeyDown={(e) => e.key === "Enter" && !renaming && onClick?.()}
      onContextMenu={(e) => {
        if (!onContextMenu) return;
        e.preventDefault();
        onContextMenu(e);
      }}
      style={style}
      className={cn(
        "flex w-full items-center text-left transition-all",
        selected ? "bg-accent-muted ring-1 ring-inset ring-accent/40" : "hover:bg-surface-hover",
        className,
      )}
    >
      {renaming ? (
        <InlineRenameInput
          initialValue={renameValue ?? ""}
          onSubmit={(value) => onRenameSubmit?.(value)}
          onCancel={() => onRenameCancel?.()}
        />
      ) : (
        children
      )}
    </div>
  );
}
