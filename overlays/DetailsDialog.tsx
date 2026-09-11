import { useEffect, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ExternalLink, Plus, X } from "lucide-react";
import { IconButton } from "../primitives/IconButton";

export interface DetailsDialogRow {
  label: string;
  value: ReactNode;
  /** Monospace + smaller text — use for paths and other machine-y values. */
  mono?: boolean;
  /** Renders a small "reveal" button (external-link icon) next to the value
   * — SLDR uses this to reveal a path in the OS file manager, but it works
   * for anything the caller wants a secondary "jump to" action on. */
  onReveal?: () => void;
}

export interface DetailsDialogAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  /** Defaults to `"solid"`. Mirrors `IconButton`'s own variants (this dialog
   * always renders actions as icon-only buttons, so `"ghost"` isn't offered
   * here — these are meant to stand out against the footer). */
  variant?: "solid" | "danger";
}

interface DetailsDialogLabels {
  close: string;
  /** Label for the icon-swatch trigger button, when `onIconClick` is given. */
  icon?: string;
  /** Label for a row's reveal button, when any row sets `onReveal`. */
  reveal?: string;
}

interface DetailsDialogProps {
  title: string;
  onClose: () => void;
  labels: DetailsDialogLabels;
  /** Current icon shown in the swatch trigger, or `null` for the empty-state
   * fallback (a plain "+"). Omit entirely (along with `onIconClick`) to skip
   * rendering the swatch — `AudioFileDetailsPanel`-style dialogs that have no
   * icon/color of their own don't need it. */
  icon?: LucideIcon | null;
  /** Inline color applied to the swatch icon/border (e.g. a folder's custom
   * color). */
  iconColor?: string | null;
  /** Opens whatever icon/color picker the caller wants (e.g. `IconPicker`
   * from `overlays/IconPicker.tsx`) — this dialog only renders the trigger
   * button, it doesn't own picker state. */
  onIconClick?: () => void;
  /** `true` while details are being fetched asynchronously — renders
   * `loadingLabel` instead of `rows` (SLDR's `FolderDetailsPanel` needs this
   * since it loads details via a backend call; a dialog whose data is
   * already fully in hand, like `AudioFileDetailsPanel`, can omit it). */
  loading?: boolean;
  loadingLabel?: string;
  /** `true` if fetching details failed — renders `errorLabel` instead of
   * `rows`. Ignored while `loading` is `true`. */
  error?: boolean;
  errorLabel?: string;
  rows: DetailsDialogRow[];
  /** Free-form content rendered after `rows`, before the footer — for
   * anything that doesn't fit the label/value row shape (SLDR uses this for
   * a transcode progress section, or a tag editor). No default styling is
   * applied; lay it out however the content needs. */
  content?: ReactNode;
  /** Icon-only action buttons (refresh/delete/etc.), right-aligned in a
   * bordered footer row. When `content` is also given, `content` takes the
   * left side of that same row (flex-1) and `actions` sit to its right —
   * this mirrors `FolderDetailsPanel`, which puts its transcode section and
   * refresh/delete buttons in one row. Omit both `content` and `actions` to
   * skip the footer row entirely. */
  actions?: DetailsDialogAction[];
}

/** Generic "details" modal: title + optional icon-swatch trigger, a list of
 * label/value rows (some revealable via a small external-link button), free
 * form extra content, and a footer of icon-only action buttons. Generalized
 * from SLDR's `FolderDetailsPanel` (async-loaded details, icon/color swatch,
 * refresh/delete footer) and `AudioFileDetailsPanel` (synchronous, no swatch,
 * no footer) — one shape covers both by making every extra bit optional. */
export function DetailsDialog({
  title,
  onClose,
  labels,
  icon: Icon,
  iconColor,
  onIconClick,
  loading = false,
  loadingLabel,
  error = false,
  errorLabel,
  rows,
  content,
  actions,
}: DetailsDialogProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const showFooter = Boolean(content) || Boolean(actions?.length);

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="details-dialog-title"
        className="animate-modal-in w-full max-w-md rounded-lg border border-border bg-surface p-4 shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {onIconClick && (
              <IconButton
                onClick={onIconClick}
                aria-label={labels.icon ?? title}
                title={labels.icon ?? title}
                variant="solid"
                size="md"
                style={iconColor ? { color: iconColor } : undefined}
              >
                {Icon ? <Icon className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </IconButton>
            )}
            <h2 id="details-dialog-title" className="truncate text-sm font-medium text-text">
              {title}
            </h2>
          </div>
          <IconButton onClick={onClose} aria-label={labels.close} variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        {loading && <p className="text-sm text-text-muted">{loadingLabel}</p>}
        {!loading && error && <p className="text-sm text-danger">{errorLabel}</p>}

        {!loading && !error && (
          <>
            <dl className="space-y-2 text-sm">
              {rows.map((row, i) => (
                <DetailsDialogRow key={i} row={row} revealLabel={labels.reveal} />
              ))}
            </dl>

            {content !== undefined && !showFooter && content}

            {showFooter && (
              <div className="mt-4 flex items-start gap-2 border-t border-border pt-3">
                {content !== undefined && <div className="min-w-0 flex-1">{content}</div>}
                {actions?.map((action, i) => (
                  <IconButton
                    key={i}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    aria-label={action.label}
                    title={action.label}
                    variant={action.variant ?? "solid"}
                    size="md"
                  >
                    {action.icon && <action.icon className="h-3.5 w-3.5" />}
                  </IconButton>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DetailsDialogRow({ row, revealLabel }: { row: DetailsDialogRow; revealLabel?: string }) {
  const { label, value, mono, onReveal } = row;
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-text-muted">{label}</dt>
      <dd className="flex min-w-0 items-center justify-end gap-1.5">
        <span className={`truncate text-right text-text ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
        {onReveal && (
          <button
            type="button"
            onClick={onReveal}
            aria-label={revealLabel}
            title={revealLabel}
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current text-[9px] font-bold leading-none text-text-muted transition-colors hover:text-accent"
          >
            <ExternalLink className="h-2.5 w-2.5" />
          </button>
        )}
      </dd>
    </div>
  );
}
