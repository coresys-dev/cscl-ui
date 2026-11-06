import { createContext, useContext, type ReactNode } from "react";
import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import { FileText, Loader2 } from "lucide-react";
import { cn } from "../lib/cn";

/** Something a "/link" can point to: another page, a note, a record. */
export interface DocLinkTarget {
  id: string;
  title: string;
  /** A second line in the menu (the parent project). */
  hint?: string;
}

export interface DocLinkSource {
  /** Targets for what was typed after "/link", best first. */
  search: (query: string) => DocLinkTarget[];
  /** The live target of a stored link (its title may have changed); null when it is gone. */
  resolve: (id: string) => DocLinkTarget | null;
  open: (id: string) => void;
  /** "/link New title" offers to create it. */
  create?: (title: string) => DocLinkTarget | null;
}

/** Something "@" can mention: a file, a person, an asset. */
export interface MentionTarget {
  id: string;
  label: string;
  /** Shown after the label ("2:14", "PNG"). */
  hint?: string;
  /** A small thumbnail in the menu and in the text. */
  preview?: ReactNode;
}

export interface MentionSource {
  search: (query: string) => MentionTarget[];
  resolve: (id: string) => MentionTarget | null;
  /** Click on a mention in the text (open a preview card at `rect`). */
  onClick?: (target: MentionTarget, rect: DOMRect) => void;
  /** Files dropped in the text are added through this, then mentioned where they landed. */
  upload?: (file: File) => Promise<MentionTarget | null>;
}

export interface NodeLabels {
  linkGone: string;
  mentionGone: string;
  uploading: string;
  open: (title: string) => string;
}

export const EditorCtx = createContext<{ links?: DocLinkSource; mentions?: MentionSource; labels: NodeLabels } | null>(null);

/** Uploads of files dropped in the text, by the id of their placeholder mention. */
export const UPLOADING = new Set<string>();

function DocLinkView({ node }: ReactNodeViewProps) {
  const ctx = useContext(EditorCtx);
  const { id, label } = node.attrs as { id: string; label: string };
  const target = ctx?.links?.resolve(id) ?? null;
  return (
    <NodeViewWrapper
      as="span"
      className={cn("cs-doc-link", !target && ctx?.links && "is-missing")}
      title={target ? ctx?.labels.open(target.title) : ctx?.labels.linkGone}
      onClick={() => target && ctx?.links?.open(id)}
      data-drag-handle=""
    >
      <FileText size={14} aria-hidden />
      <span>{target?.title ?? label}</span>
    </NodeViewWrapper>
  );
}

/** A link to another document, showing its live title. */
export const DocLink = Node.create({
  name: "docLink",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  addAttributes() {
    return { id: { default: null }, label: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "span[data-doc-link]", getAttrs: (el) => ({ id: el.getAttribute("data-doc-link"), label: el.textContent ?? "" }) }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-doc-link": node.attrs.id }), node.attrs.label || "Link"];
  },
  renderText({ node }) {
    return node.attrs.label;
  },
  addNodeView() {
    return ReactNodeViewRenderer(DocLinkView, { as: "span" });
  },
});

function MentionView({ node }: ReactNodeViewProps) {
  const ctx = useContext(EditorCtx);
  const { id, label, uploadId } = node.attrs as { id: string; label: string; uploadId: string | null };
  if (uploadId && UPLOADING.has(uploadId)) {
    return (
      <NodeViewWrapper as="span" className="cs-mention is-pending" title={ctx?.labels.uploading}>
        <Loader2 size={14} className="animate-spin text-text-muted" />
        <span className="cs-mention__label">@{label}</span>
      </NodeViewWrapper>
    );
  }
  const target = ctx?.mentions?.resolve(id) ?? null;
  return (
    <NodeViewWrapper
      as="span"
      className={cn("cs-mention", !target && ctx?.mentions && "is-missing")}
      title={target ? undefined : ctx?.labels.mentionGone}
      onClick={(e: React.MouseEvent<HTMLElement>) => target && ctx?.mentions?.onClick?.(target, e.currentTarget.getBoundingClientRect())}
    >
      {target?.preview}
      <span className="cs-mention__label">
        @{target?.label ?? label}
        {target?.hint && ` (${target.hint})`}
      </span>
    </NodeViewWrapper>
  );
}

/** "@something": a reference to a file or a record, with its preview. */
export const Mention = Node.create({
  name: "mention",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes() {
    return { id: { default: null }, label: { default: "" }, uploadId: { default: null, rendered: false } };
  },
  parseHTML() {
    return [{ tag: "span[data-mention]", getAttrs: (el) => ({ id: el.getAttribute("data-mention"), label: (el.textContent ?? "").replace(/^@/, "") }) }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-mention": node.attrs.id }), `@${node.attrs.label}`];
  },
  renderText({ node }) {
    return `@${node.attrs.label}`;
  },
  addNodeView() {
    return ReactNodeViewRenderer(MentionView, { as: "span" });
  },
});
