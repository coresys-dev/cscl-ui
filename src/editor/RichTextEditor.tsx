import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Extension, posToDOMRect, type Editor, type JSONContent, type Range } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extensions";
import Suggestion, { type SuggestionKeyDownProps, type SuggestionProps } from "@tiptap/suggestion";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { marked } from "marked";
import {
  AtSign,
  Code,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Pilcrow,
  Plus,
  Quote,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../lib/cn";
import { CommentCard, type CommentCardLabels } from "../overlays/CommentCard";
import { DocFileDrop } from "./fileDrop";
import { DEFAULT_FORMAT_LABELS, FormatBubble, type FormatBubbleLabels } from "./FormatBubble";
import { Comment, findComment, Highlight, TextColor, updateComment } from "./marks";
import { DocLink, EditorCtx, Mention, type DocLinkSource, type DocLinkTarget, type MentionSource, type MentionTarget, type NodeLabels } from "./nodes";

type BlockKey = "text" | "h1" | "h2" | "h3" | "bullet" | "ordered" | "todo" | "quote" | "code" | "divider" | "link";

export interface RichTextEditorLabels {
  placeholder: string;
  headingPlaceholder: (level: number) => string;
  blocks: string;
  linkHeading: string;
  mentionHeading: string;
  commands: string;
  newLink: (title: string) => string;
  block: Record<BlockKey, { label: string; hint: string }>;
  format: FormatBubbleLabels;
  comment: Partial<CommentCardLabels>;
  nodes: NodeLabels;
  drop: { here: string; many: (n: number) => string; newLine: string };
}

const DEFAULT_LABELS: RichTextEditorLabels = {
  placeholder: "Write, or type / for blocks",
  headingPlaceholder: (n) => `Heading ${n}`,
  blocks: "Blocks",
  linkHeading: "Link to",
  mentionHeading: "Mention",
  commands: "Commands",
  newLink: (t) => `New: ${t}`,
  block: {
    text: { label: "Text", hint: "Plain paragraph" },
    h1: { label: "Heading 1", hint: "# " },
    h2: { label: "Heading 2", hint: "## " },
    h3: { label: "Heading 3", hint: "### " },
    bullet: { label: "Bulleted list", hint: "- " },
    ordered: { label: "Numbered list", hint: "1. " },
    todo: { label: "Checklist", hint: "[] " },
    quote: { label: "Quote", hint: "> " },
    code: { label: "Code", hint: "```" },
    divider: { label: "Divider", hint: "---" },
    link: { label: "Link to…", hint: "/link" },
  },
  format: DEFAULT_FORMAT_LABELS,
  comment: {},
  nodes: { linkGone: "This link's target was deleted", mentionGone: "No longer available", uploading: "Adding…", open: (t) => `Open ${t}` },
  drop: { here: "Insert here", many: (n) => `Insert ${n} files here`, newLine: "new line" },
};

export interface RichTextEditorProps {
  /** Tiptap JSON, or HTML / empty for a new document. Read once: the editor owns the document after that. */
  content: JSONContent | string | null;
  /** The whole document as JSON after every change. */
  onChange?: (doc: JSONContent) => void;
  editable?: boolean;
  autofocus?: boolean;
  /** "/link": links to other documents. Absent: no link command. */
  links?: DocLinkSource;
  /** "@": mentions, and files dropped in the text. Absent: no mentions. */
  mentions?: MentionSource;
  /** Comments on a selection (⌘/Ctrl+Alt+M, or the format bubble). Default on. */
  comments?: boolean;
  /** Opens a web link on ⌘/Ctrl+click (in a Tauri app: the opener plugin). Default: a new browser tab. */
  onOpenLink?: (url: string) => void;
  labels?: Partial<RichTextEditorLabels>;
  className?: string;
}

const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

interface BlockCommand {
  kind: "block";
  key: BlockKey;
  icon: LucideIcon;
  keywords: string[];
  run: (editor: Editor, range: Range) => void;
}
type MenuItem =
  | BlockCommand
  | { kind: "link"; key: string; target: DocLinkTarget }
  | { kind: "create"; key: string; title: string }
  | { kind: "mention"; key: string; target: MentionTarget };

const BLOCKS: BlockCommand[] = [
  { kind: "block", key: "text", icon: Pilcrow, keywords: ["text", "paragraph", "texte"], run: (e, r) => e.chain().focus().deleteRange(r).setParagraph().run() },
  {
    kind: "block",
    key: "h1",
    icon: Heading1,
    keywords: ["h1", "heading", "title", "titre"],
    run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 1 }).run(),
  },
  {
    kind: "block",
    key: "h2",
    icon: Heading2,
    keywords: ["h2", "heading", "title", "titre"],
    run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 2 }).run(),
  },
  {
    kind: "block",
    key: "h3",
    icon: Heading3,
    keywords: ["h3", "heading", "title", "titre"],
    run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 3 }).run(),
  },
  {
    kind: "block",
    key: "bullet",
    icon: List,
    keywords: ["bullet", "list", "ul", "liste", "puces"],
    run: (e, r) => e.chain().focus().deleteRange(r).toggleBulletList().run(),
  },
  {
    kind: "block",
    key: "ordered",
    icon: ListOrdered,
    keywords: ["numbered", "ordered", "list", "ol", "numerotee"],
    run: (e, r) => e.chain().focus().deleteRange(r).toggleOrderedList().run(),
  },
  {
    kind: "block",
    key: "todo",
    icon: ListChecks,
    keywords: ["todo", "checklist", "tasks", "checkbox", "taches"],
    run: (e, r) => e.chain().focus().deleteRange(r).toggleTaskList().run(),
  },
  { kind: "block", key: "quote", icon: Quote, keywords: ["quote", "citation"], run: (e, r) => e.chain().focus().deleteRange(r).toggleBlockquote().run() },
  { kind: "block", key: "code", icon: Code, keywords: ["code"], run: (e, r) => e.chain().focus().deleteRange(r).toggleCodeBlock().run() },
  {
    kind: "block",
    key: "divider",
    icon: Minus,
    keywords: ["divider", "separator", "line", "hr", "separateur"],
    run: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run(),
  },
  // Keeps the menu open on "/link " so the next characters search the targets.
  { kind: "block", key: "link", icon: FileText, keywords: ["link", "page", "lien"], run: (e, r) => e.chain().focus().insertContentAt(r, "/link ").run() },
];

const MARKDOWN_HINT = /^(#{1,6}\s|[-*+]\s|\d+[.)]\s|>\s|```|- \[[ xX]\]\s)|\*\*[^*]+\*\*|__[^_]+__|`[^`\n]+`|\[[^\]]+\]\([^)]+\)|^---$/m;

/** Plain text that looks like Markdown is pasted as formatted content. */
const MarkdownPaste = Extension.create({
  name: "markdownPaste",
  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        props: {
          handlePaste: (_view, event) => {
            const data = event.clipboardData;
            if (!data || data.types.includes("text/html")) return false;
            const text = data.getData("text/plain");
            if (!text || !MARKDOWN_HINT.test(text)) return false;
            editor
              .chain()
              .focus()
              .insertContent(marked.parse(text, { async: false, gfm: true, breaks: false }))
              .run();
            return true;
          },
        },
      }),
    ];
  },
});

/** The document schema without the editing helpers: render a stored document elsewhere with `generateHTML` or a read-only editor. */
export const RICH_TEXT_EXTENSIONS = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  TaskList,
  TaskItem.configure({ nested: true }),
  DocLink,
  Mention,
  TextColor,
  Highlight,
  Comment,
];

interface MenuState {
  items: MenuItem[];
  index: number;
  rect: DOMRect | null;
  pick: (item: MenuItem) => void;
  heading: string;
}

/** A Notion-like document editor (tiptap): "/" for blocks (headings, lists,
 * checklists, quote, code, divider), Markdown shortcuts and Markdown paste, a
 * format bubble over any selection (bold, italic, underline, strike, code, link,
 * text and highlight colours), comments pinned to words, and, when the app
 * provides them, "/link" to other documents, "@" mentions and files dropped in
 * the text. Import `@coresys/cscl-ui/theme/editor.css` for the document styles. */
export function RichTextEditor({
  content,
  onChange,
  editable = true,
  autofocus,
  links,
  mentions,
  comments = true,
  onOpenLink,
  labels,
  className,
}: RichTextEditorProps) {
  const l: RichTextEditorLabels = {
    ...DEFAULT_LABELS,
    ...labels,
    format: { ...DEFAULT_FORMAT_LABELS, ...labels?.format },
    block: { ...DEFAULT_LABELS.block, ...labels?.block },
  };
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [note, setNote] = useState<{ id: string | null; from: number; to: number; rect: DOMRect } | null>(null);
  const openNewNote = useRef(() => {});
  const menuRef = useRef<MenuState | null>(null);
  menuRef.current = menu;
  const props = useRef({ onChange, links, mentions, onOpenLink, l });
  props.current = { onChange, links, mentions, onOpenLink, l };
  const getMentions = useCallback(() => props.current.mentions, []);

  /** The menu shared by "/" and "@": the same list, keys and placement. */
  const renderer = (heading: (query: string) => string) => () => {
    const sync = (p: SuggestionProps<MenuItem, MenuItem>) => {
      if (!p.items.length) return setMenu(null);
      setMenu((m) => ({
        items: p.items,
        index: m && m.items.length === p.items.length ? Math.min(m.index, p.items.length - 1) : 0,
        rect: p.clientRect?.() ?? null,
        pick: (item) => p.command(item),
        heading: heading(p.query),
      }));
    };
    return {
      onStart: sync,
      onUpdate: sync,
      onExit: () => setMenu(null),
      onKeyDown: ({ event }: SuggestionKeyDownProps) => {
        const m = menuRef.current;
        if (!m) return false;
        if (event.key === "Escape") {
          setMenu(null);
          return true;
        }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          const d = event.key === "ArrowDown" ? 1 : -1;
          setMenu({ ...m, index: (m.index + d + m.items.length) % m.items.length });
          return true;
        }
        if (event.key === "Enter" || event.key === "Tab") {
          m.pick(m.items[m.index]);
          return true;
        }
        return false;
      },
    };
  };

  const editor = useEditor({
    immediatelyRender: true,
    shouldRerenderOnTransaction: false,
    editable,
    autofocus: autofocus ? "end" : false,
    content: content ?? "",
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: { openOnClick: false, autolink: true, defaultProtocol: "https" } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: ({ node }) => (node.type.name === "heading" ? props.current.l.headingPlaceholder(node.attrs.level) : props.current.l.placeholder),
      }),
      DocLink,
      Mention,
      MarkdownPaste,
      TextColor,
      Highlight,
      Comment.configure({ onShortcut: () => comments && openNewNote.current() }),
      Extension.create({
        name: "commandMenus",
        addProseMirrorPlugins() {
          return [
            Suggestion<MenuItem, MenuItem>({
              editor: this.editor,
              char: "/",
              allowSpaces: true,
              items: ({ query }) => slashItems(query, props.current.links),
              command: ({ editor: ed, range, props: item }) => runItem(ed, range, item, props.current.links),
              render: renderer((q) => (/^link(\s|$)/i.test(q) ? props.current.l.linkHeading : props.current.l.blocks)),
            }),
            Suggestion<MenuItem, MenuItem>({
              editor: this.editor,
              char: "@",
              pluginKey: new PluginKey("mention"),
              items: ({ query }) =>
                (props.current.mentions?.search(query) ?? []).slice(0, 8).map<MenuItem>((target) => ({ kind: "mention", key: target.id, target })),
              command: ({ editor: ed, range, props: item }) => runItem(ed, range, item, props.current.links),
              render: renderer(() => props.current.l.mentionHeading),
            }),
          ];
        },
      }),
    ],
    editorProps: {
      attributes: { class: "cs-doc", spellcheck: "true" },
      // Links never navigate the app window: ⌘/Ctrl+click opens them outside.
      handleClick: (_view, _pos, event) => {
        const target = event.target as HTMLElement;
        const a = target.closest("a");
        const noted = target.closest<HTMLElement>("[data-comment]");
        if (noted && !(a && (event.metaKey || event.ctrlKey))) {
          setNote({ id: noted.dataset.comment ?? "", from: 0, to: 0, rect: noted.getBoundingClientRect() });
          return false;
        }
        if (!a) return false;
        event.preventDefault();
        if ((event.metaKey || event.ctrlKey) && a.href) {
          const open = props.current.onOpenLink;
          if (open) open(a.href);
          else window.open(a.href, "_blank", "noreferrer");
        }
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => props.current.onChange?.(ed.getJSON()),
  });

  useEffect(() => editor.setEditable(editable), [editor, editable]);

  openNewNote.current = () => {
    const { from, to, empty } = editor.state.selection;
    if (!empty) setNote({ id: null, from, to, rect: posToDOMRect(editor.view, from, to) });
  };
  const noted = note?.id ? findComment(editor, note.id) : null;

  return (
    <EditorCtx.Provider value={{ links, mentions, labels: l.nodes }}>
      <EditorContent editor={editor} className={cn("cs-doc-host", className)} />
      {editable && menu && <CommandMenu menu={menu} labels={l} onHover={(index) => setMenu({ ...menu, index })} />}
      {editable && <FormatBubble editor={editor} onComment={comments ? () => openNewNote.current() : undefined} labels={l.format} />}
      {editable && mentions?.upload && <DocFileDrop editor={editor} mentions={getMentions} labels={l.drop} />}
      {comments && note && (note.id === null || noted) && (
        <CommentCard
          key={note.id ?? "new"}
          rect={note.rect}
          text={noted?.text ?? ""}
          meta={
            noted?.createdAt
              ? new Date(noted.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
              : undefined
          }
          labels={l.comment}
          onOpenLink={onOpenLink}
          onClose={() => setNote(null)}
          onSave={(text) => {
            if (note.id) updateComment(editor, note.id, { text });
            else
              editor
                .chain()
                .focus()
                .setTextSelection({ from: note.from, to: note.to })
                .setMark("comment", { id: crypto.randomUUID(), text, createdAt: new Date().toISOString() })
                .run();
            setNote(null);
          }}
          onDelete={
            note.id && editable
              ? () => {
                  updateComment(editor, note.id!, null);
                  setNote(null);
                }
              : undefined
          }
        />
      )}
    </EditorCtx.Provider>
  );
}

function slashItems(query: string, links?: DocLinkSource): MenuItem[] {
  const linkQuery = /^link(?:\s+(.*))?$/i.exec(query);
  if (links && linkQuery && (query.length > 4 || query.endsWith(" "))) {
    const title = linkQuery[1]?.trim() ?? "";
    const matches = links
      .search(title)
      .slice(0, 5)
      .map<MenuItem>((target) => ({ kind: "link", key: target.id, target }));
    const exact = matches.some((m) => m.kind === "link" && fold(m.target.title) === fold(title));
    return title && !exact && links.create ? [...matches, { kind: "create", key: "create", title }] : matches;
  }
  const q = fold(query.trim());
  if (q.includes(" ")) return [];
  return BLOCKS.filter((b) => (b.key !== "link" || links) && (!q || b.keywords.some((k) => fold(k).startsWith(q))));
}

function runItem(editor: Editor, range: Range, item: MenuItem, links?: DocLinkSource) {
  if (item.kind === "block") return item.run(editor, range);
  if (item.kind === "mention") {
    editor
      .chain()
      .focus()
      .insertContentAt(range, [
        { type: "mention", attrs: { id: item.target.id, label: item.target.label } },
        { type: "text", text: " " },
      ])
      .run();
    return;
  }
  const target = item.kind === "link" ? item.target : links?.create?.(item.title);
  if (!target) return;
  editor
    .chain()
    .focus()
    .insertContentAt(range, [
      { type: "docLink", attrs: { id: target.id, label: target.title } },
      { type: "text", text: " " },
    ])
    .run();
}

function CommandMenu({ menu, labels, onHover }: { menu: MenuState; labels: RichTextEditorLabels; onHover: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const r = menu.rect;
    if (!el || !r) return;
    const h = el.offsetHeight;
    const w = el.offsetWidth;
    const below = r.bottom + 6 + h < window.innerHeight - 8;
    setPos({ left: Math.max(8, Math.min(r.left, window.innerWidth - w - 8)), top: below ? r.bottom + 6 : Math.max(8, r.top - h - 6) });
  }, [menu.rect, menu.items.length]);

  useEffect(() => {
    ref.current?.querySelector(`[data-index="${menu.index}"]`)?.scrollIntoView({ block: "nearest" });
  }, [menu.index]);

  return createPortal(
    <div
      ref={ref}
      role="listbox"
      aria-label={labels.commands}
      // An open menu takes Escape for itself (see the overlay stack in Modal).
      data-escape-guard=""
      onMouseDown={(e) => e.preventDefault()}
      style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? "visible" : "hidden" }}
      className="animate-modal-in fixed z-[80] max-h-80 w-72 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-float"
    >
      <p className="px-2.5 pb-1 pt-1.5 text-xs text-text-muted">{menu.heading}</p>
      {menu.items.map((item, i) => {
        const active = i === menu.index;
        const Icon = item.kind === "block" ? item.icon : item.kind === "link" ? FileText : item.kind === "mention" ? AtSign : Plus;
        const label =
          item.kind === "block"
            ? labels.block[item.key].label
            : item.kind === "link"
              ? item.target.title
              : item.kind === "mention"
                ? item.target.label
                : labels.newLink(item.title);
        const hint =
          item.kind === "block"
            ? labels.block[item.key].hint
            : item.kind === "link"
              ? item.target.hint
              : item.kind === "mention"
                ? item.target.hint
                : undefined;
        return (
          <button
            key={item.key}
            type="button"
            role="option"
            aria-selected={active}
            data-index={i}
            onMouseMove={() => !active && onHover(i)}
            onClick={() => menu.pick(item)}
            className={cn("flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm text-text", active && "bg-surface-hover")}
          >
            {item.kind === "mention" && item.target.preview ? (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md">{item.target.preview}</span>
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface-raised text-text-muted">
                <Icon size={16} />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate">{label}</span>
              {hint && <span className="block truncate text-xs text-text-muted">{hint}</span>}
            </span>
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
