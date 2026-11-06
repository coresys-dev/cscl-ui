import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import { UPLOADING, type MentionSource, type MentionTarget } from "./nodes";

/** Near a block's top or bottom edge (px), a drop goes on its own line. */
const EDGE = 7;
const LEAF = "￼";

const carriesFiles = (e: DragEvent) => !!e.dataTransfer && [...e.dataTransfer.types].includes("Files");

/** Where a drop at (x, y) lands: inside a line at the nearest word boundary (never mid-word), or between two blocks as a line of its own. */
type Target =
  | { kind: "inline"; pos: number; before: string; after: string; left: number; top: number; height: number }
  | { kind: "block"; pos: number; left: number; width: number; top: number };

function targetAt(view: EditorView, x: number, y: number): Target {
  const { doc } = view.state;
  const content = view.dom.getBoundingClientRect();
  const blocks: { start: number; end: number; node: PMNode; rect: DOMRect }[] = [];
  doc.forEach((node, offset) => {
    const dom = view.nodeDOM(offset);
    if (dom instanceof HTMLElement) blocks.push({ start: offset, end: offset + node.nodeSize, node, rect: dom.getBoundingClientRect() });
  });
  const line = (pos: number, top: number): Target => ({ kind: "block", pos, left: content.left, width: content.width, top });
  if (!blocks.length) return line(0, content.top);
  if (y < blocks[0].rect.top) return line(0, blocks[0].rect.top - 3);
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const next = blocks[i + 1];
    const below = next ? (b.rect.bottom + next.rect.top) / 2 : b.rect.bottom + 3;
    if (y > b.rect.bottom) {
      if (!next || y < next.rect.top) return line(b.end, below);
      continue;
    }
    const above = i > 0 ? (blocks[i - 1].rect.bottom + b.rect.top) / 2 : b.rect.top - 3;
    const emptyText = b.node.isTextblock && !b.node.content.size;
    if (y - b.rect.top < EDGE && !emptyText) return line(b.start, above);
    if (b.rect.bottom - y < EDGE && !emptyText) return line(b.end, below);
    const at = view.posAtCoords({ left: Math.min(Math.max(x, b.rect.left + 1), b.rect.right - 1), top: y });
    const $pos = at ? doc.resolve(at.pos) : null;
    if (!$pos || !$pos.parent.isTextblock || $pos.parent.type.spec.code)
      return y < (b.rect.top + b.rect.bottom) / 2 ? line(b.start, above) : line(b.end, below);
    // Snap to the nearest word boundary of that line.
    const text = $pos.parent.textBetween(0, $pos.parent.content.size, undefined, LEAF);
    const off = $pos.parentOffset;
    const space = (c: string | undefined) => c === undefined || /\s/.test(c) || c === LEAF;
    let best = off;
    for (let d = 0; d <= text.length; d++) {
      if (off - d >= 0 && (space(text[off - d - 1]) || space(text[off - d]))) {
        best = off - d;
        break;
      }
      if (off + d <= text.length && (space(text[off + d - 1]) || space(text[off + d]))) {
        best = off + d;
        break;
      }
    }
    const pos = $pos.start() + best;
    const c = view.coordsAtPos(pos);
    return { kind: "inline", pos, before: text[best - 1] ?? "", after: text[best] ?? "", left: c.left, top: c.top, height: c.bottom - c.top };
  }
  return line(doc.content.size, blocks[blocks.length - 1].rect.bottom + 3);
}

/** Puts mentions at the target: inline with spaces around as needed, or as a new line. */
function insertAt(view: EditorView, target: Target, mentions: PMNode[]) {
  const { state } = view;
  const sp = () => state.schema.text(" ");
  const inline = mentions.flatMap((m, i) => (i ? [sp(), m] : [m]));
  const tr =
    target.kind === "inline"
      ? state.tr.insert(target.pos, [
          ...(target.before && !/\s/.test(target.before) ? [sp()] : []),
          ...inline,
          ...(target.after && !/\s/.test(target.after) ? [sp()] : []),
        ])
      : state.tr.insert(target.pos, state.schema.nodes.paragraph.create(null, inline));
  view.dispatch(tr.scrollIntoView());
  view.focus();
}

/** Turns the placeholder of an upload into the mention of the added item, or removes it. */
function settleUpload(view: EditorView, uploadId: string, target: MentionTarget | null) {
  UPLOADING.delete(uploadId);
  if (view.isDestroyed) return;
  let found = null as { pos: number; size: number; attrs: Record<string, unknown> } | null;
  view.state.doc.descendants((node, pos) => {
    if (found) return false;
    if (node.type.name === "mention" && node.attrs.uploadId === uploadId) found = { pos, size: node.nodeSize, attrs: node.attrs };
    return !found;
  });
  if (!found) return;
  const { pos, size, attrs } = found;
  const tr = target
    ? view.state.tr.setNodeMarkup(pos, undefined, { ...attrs, id: target.id, label: target.label, uploadId: null })
    : view.state.tr.delete(pos, pos + size);
  // The drop itself is the undo step; the upload finishing is not another one.
  view.dispatch(tr.setMeta("addToHistory", false));
}

/** Files dragged over the text: the drop point is drawn (a bar between words, a line
 * between blocks) and a drop uploads the files through `mentions.upload`, a
 * placeholder showing until each one is added and mentioned there. */
export function DocFileDrop({
  editor,
  mentions,
  labels,
}: {
  editor: Editor;
  mentions: () => MentionSource | undefined;
  labels: { here: string; many: (n: number) => string; newLine: string };
}) {
  const [shown, setShown] = useState<{ target: Target; label: string } | null>(null);
  const last = useRef("");
  const l = useRef(labels);
  l.current = labels;

  useEffect(() => {
    const view = editor.view;
    const inside = (e: DragEvent) => {
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      return !!hit && view.dom.contains(hit);
    };
    const hide = () => {
      if (!last.current) return;
      last.current = "";
      setShown(null);
    };
    const usable = (e: DragEvent) => carriesFiles(e) && editor.isEditable && !!mentions()?.upload;
    const over = (e: DragEvent) => {
      if (!usable(e) || !inside(e)) return hide();
      e.preventDefault();
      // ProseMirror would draw its own drop cursor too.
      if (e.type === "dragover") e.stopPropagation();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      const target = targetAt(view, e.clientX, e.clientY);
      const count = [...(e.dataTransfer?.items ?? [])].filter((i) => i.kind === "file").length;
      const label = count > 1 ? l.current.many(count) : l.current.here;
      const key = JSON.stringify([target, label]);
      if (key !== last.current) {
        last.current = key;
        setShown({ target, label });
      }
    };
    const leave = (e: DragEvent) => {
      if (!e.relatedTarget && (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) hide();
    };
    const drop = (e: DragEvent) => {
      if (!usable(e) || !inside(e)) return hide();
      const target = targetAt(view, e.clientX, e.clientY);
      hide();
      e.preventDefault();
      // Nothing else (a window-wide file drop) handles this drop.
      e.stopPropagation();
      const source = mentions();
      const list = [...(e.dataTransfer?.files ?? [])];
      if (!source?.upload || !list.length) return;
      const ids = list.map(() => crypto.randomUUID());
      ids.forEach((id) => UPLOADING.add(id));
      insertAt(
        view,
        target,
        list.map((f, i) => view.state.schema.nodes.mention.create({ label: f.name, uploadId: ids[i] })),
      );
      // One at a time, in order, so mentions settle as their files arrive.
      void (async () => {
        for (const [i, f] of list.entries()) settleUpload(view, ids[i], await source.upload!(f).catch(() => null));
      })();
    };
    window.addEventListener("dragenter", over, true);
    window.addEventListener("dragover", over, true);
    window.addEventListener("dragleave", leave, true);
    window.addEventListener("drop", drop, true);
    window.addEventListener("dragend", hide, true);
    return () => {
      hide();
      window.removeEventListener("dragenter", over, true);
      window.removeEventListener("dragover", over, true);
      window.removeEventListener("dragleave", leave, true);
      window.removeEventListener("drop", drop, true);
      window.removeEventListener("dragend", hide, true);
    };
  }, [editor, mentions]);

  if (!shown) return null;
  const t = shown.target;
  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[70]">
      {t.kind === "inline" ? (
        <div
          className="absolute w-0.5 rounded-full bg-accent shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-accent)_25%,transparent)]"
          style={{ left: t.left - 1, top: t.top - 2, height: t.height + 4 }}
        >
          <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-sm bg-accent px-1.5 text-[11px] font-medium leading-[18px] text-bg">
            {shown.label}
          </span>
        </div>
      ) : (
        <div className="absolute h-0.5 rounded-full bg-accent" style={{ left: t.left, top: t.top - 1, width: t.width }}>
          <span className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full bg-accent" />
          <span className="absolute -top-[22px] left-2 whitespace-nowrap rounded-sm bg-accent px-1.5 text-[11px] font-medium leading-[18px] text-bg">
            {shown.label} · {labels.newLine}
          </span>
        </div>
      )}
    </div>,
    document.body,
  );
}
