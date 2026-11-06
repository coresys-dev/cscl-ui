import { Mark, mergeAttributes, type Editor } from "@tiptap/core";

/** Text and highlight colours: a swatch token name, or "muted" for grey. Stored by name so they follow the theme. */
export const TEXT_COLORS = [
  "muted",
  "swatch-red",
  "swatch-orange",
  "swatch-amber",
  "swatch-emerald",
  "swatch-cyan",
  "swatch-blue",
  "swatch-purple",
  "swatch-pink",
] as const;
export type TextColorName = (typeof TEXT_COLORS)[number];

const known = (name: unknown): name is TextColorName => typeof name === "string" && (TEXT_COLORS as readonly string[]).includes(name);

export function colorVar(name: string): string {
  return name === "muted" ? "var(--color-text-muted)" : `var(--color-${name})`;
}

export const TextColor = Mark.create({
  name: "textColor",
  addAttributes() {
    return { color: { default: null } };
  },
  parseHTML() {
    return [
      { tag: "span[data-text-color]", getAttrs: (el) => (known(el.getAttribute("data-text-color")) ? { color: el.getAttribute("data-text-color") } : false) },
    ];
  },
  renderHTML({ mark, HTMLAttributes }) {
    const color = known(mark.attrs.color) ? mark.attrs.color : "muted";
    return ["span", mergeAttributes(HTMLAttributes, { "data-text-color": color, style: `--tc: ${colorVar(color)}` }), 0];
  },
});

export const Highlight = Mark.create({
  name: "highlight",
  addAttributes() {
    return { color: { default: null } };
  },
  parseHTML() {
    return [
      { tag: "mark[data-highlight]", getAttrs: (el) => (known(el.getAttribute("data-highlight")) ? { color: el.getAttribute("data-highlight") } : false) },
    ];
  },
  renderHTML({ mark, HTMLAttributes }) {
    const color = known(mark.attrs.color) ? mark.attrs.color : "swatch-amber";
    return ["mark", mergeAttributes(HTMLAttributes, { "data-highlight": color, style: `--hc: ${colorVar(color)}` }), 0];
  },
});

export interface CommentAttrs {
  id: string;
  text: string;
  createdAt: string;
}

/** A note pinned to a run of text. Its text lives in the mark itself, so it moves,
 * copies and undoes with the words it belongs to; deleting those words deletes the note. */
export const Comment = Mark.create<{ onShortcut: () => void }>({
  name: "comment",
  inclusive: false,
  addOptions() {
    return { onShortcut: () => undefined };
  },
  addAttributes() {
    return { id: { default: "" }, text: { default: "" }, createdAt: { default: "" } };
  },
  parseHTML() {
    return [
      {
        tag: "span[data-comment]",
        getAttrs: (el) => ({
          id: el.getAttribute("data-comment"),
          text: el.getAttribute("data-comment-text") ?? "",
          createdAt: el.getAttribute("data-comment-at") ?? "",
        }),
      },
    ];
  },
  renderHTML({ mark, HTMLAttributes }) {
    const a = mark.attrs as CommentAttrs;
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-comment": a.id, "data-comment-text": a.text, "data-comment-at": a.createdAt, class: "cs-comment" }),
      0,
    ];
  },
  addKeyboardShortcuts() {
    return {
      "Mod-Alt-m": () => {
        if (this.editor.state.selection.empty) return false;
        this.options.onShortcut();
        return true;
      },
    };
  },
});

/** The comment of that id, wherever its text sits in the document. */
export function findComment(editor: Editor, id: string): CommentAttrs | null {
  let found: CommentAttrs | null = null;
  editor.state.doc.descendants((node) => {
    if (found) return false;
    const m = node.marks.find((x) => x.type.name === "comment" && x.attrs.id === id);
    if (m) found = m.attrs as CommentAttrs;
    return !found;
  });
  return found;
}

/** Rewrites a comment on every run of text carrying it; `null` removes it and keeps the text. */
export function updateComment(editor: Editor, id: string, patch: Partial<CommentAttrs> | null) {
  const type = editor.schema.marks.comment;
  const tr = editor.state.tr;
  editor.state.doc.descendants((node, pos) => {
    const m = node.marks.find((x) => x.type === type && x.attrs.id === id);
    if (!m) return;
    tr.removeMark(pos, pos + node.nodeSize, m);
    if (patch) tr.addMark(pos, pos + node.nodeSize, type.create({ ...m.attrs, ...patch }));
  });
  if (tr.docChanged) editor.view.dispatch(tr);
}
