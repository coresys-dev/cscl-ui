import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MessageSquare, Pencil, Trash2 } from "lucide-react";
import { Button } from "../primitives/Button";
import { IconButton } from "../primitives/IconButton";
import { useOverlayStack } from "./Modal";

const URL_RE = /(https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]])/g;

/** Plain text with its web addresses turned into links. */
export function Linkified({ text, onOpenLink, className }: { text: string; onOpenLink?: (url: string) => void; className?: string }) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(URL_RE)) {
    const i = m.index ?? 0;
    if (i > last) parts.push(text.slice(last, i));
    const href = m[0];
    parts.push(
      <a
        key={i}
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={
          onOpenLink
            ? (e) => {
                e.preventDefault();
                onOpenLink(href);
              }
            : undefined
        }
        className="break-all underline decoration-text-muted underline-offset-2 hover:decoration-accent"
      >
        {href}
      </a>,
    );
    last = i + href.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <p className={className ?? "selectable whitespace-pre-wrap break-words text-sm leading-5 text-text"}>{parts}</p>;
}

export interface CommentCardLabels {
  newComment: string;
  comment: string;
  edit: string;
  delete: string;
  placeholder: string;
  cancel: string;
  save: string;
  add: string;
}

const DEFAULT_LABELS: CommentCardLabels = {
  newComment: "New comment",
  comment: "Comment",
  edit: "Edit",
  delete: "Delete",
  placeholder: "Write a comment",
  cancel: "Cancel",
  save: "Save",
  add: "Comment",
};

export interface CommentCardProps {
  /** The words (or the point) the comment is about: the card sits under it, or above when there's no room. */
  rect: DOMRect;
  /** Empty for a new comment, which opens in edit mode. */
  text: string;
  /** Already formatted, e.g. "Added on 6 Nov". */
  meta?: ReactNode;
  onSave: (text: string) => void;
  onDelete?: () => void;
  onClose: () => void;
  /** Opens a link found in the text (in a Tauri app: the opener plugin). Default: a new browser tab. */
  onOpenLink?: (url: string) => void;
  labels?: Partial<CommentCardLabels>;
}

/** A note on some words: written, read, edited or removed in a small card
 * under them. ⌘/Ctrl+Enter saves; web addresses in the text become links. */
export function CommentCard({ rect, text, meta, onSave, onDelete, onClose, onOpenLink, labels }: CommentCardProps) {
  const l = { ...DEFAULT_LABELS, ...labels };
  useOverlayStack(onClose);
  const ref = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(!text);
  const [draft, setDraft] = useState(text);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const h = el.offsetHeight;
    const w = el.offsetWidth;
    const below = rect.bottom + 8 + h <= window.innerHeight - 8;
    setPos({ left: Math.max(8, Math.min(rect.left, window.innerWidth - w - 8)), top: below ? rect.bottom + 8 : Math.max(8, rect.top - h - 8) });
  }, [rect, editing]);

  const save = () => {
    const v = draft.trim();
    if (v) onSave(v);
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[60]" onMouseDown={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-label={text ? l.comment : l.newComment}
        style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? "visible" : "hidden" }}
        className="animate-modal-in fixed z-[60] w-80 rounded-lg border border-border bg-surface p-3 shadow-float"
      >
        <div className="mb-2 flex items-center gap-2 text-xs text-text-muted">
          <MessageSquare size={13} className="shrink-0 text-accent-2" />
          <span className="flex-1">{meta ?? (text ? l.comment : l.newComment)}</span>
          {!editing && (
            <>
              <IconButton aria-label={l.edit} onClick={() => setEditing(true)} className="h-7 w-7">
                <Pencil />
              </IconButton>
              {onDelete && (
                <IconButton aria-label={l.delete} onClick={onDelete} className="h-7 w-7 hover:text-danger">
                  <Trash2 />
                </IconButton>
              )}
            </>
          )}
        </div>
        {editing ? (
          <>
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  save();
                }
              }}
              rows={3}
              placeholder={l.placeholder}
              aria-label={l.placeholder}
              className="w-full resize-none rounded-md border border-border bg-surface-raised px-2.5 py-2 text-sm text-text outline-none placeholder:text-text-muted focus:border-accent"
            />
            <div className="mt-2 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={
                  text
                    ? () => {
                        setDraft(text);
                        setEditing(false);
                      }
                    : onClose
                }
              >
                {l.cancel}
              </Button>
              <Button size="sm" onClick={save} disabled={!draft.trim()}>
                {text ? l.save : l.add}
              </Button>
            </div>
          </>
        ) : (
          <Linkified text={text} onOpenLink={onOpenLink} />
        )}
      </div>
    </>,
    document.body,
  );
}
