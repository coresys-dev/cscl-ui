import { useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import type { Editor } from "@tiptap/core";
import { BubbleMenu } from "@tiptap/react/menus";
import { Baseline, Bold, Check, Code, Italic, Link2, MessageSquarePlus, Strikethrough, Underline, Unlink, type LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";
import { isMacOS } from "../lib/platform";
import { colorVar, TEXT_COLORS } from "./marks";

export interface FormatBubbleLabels {
  bold: string;
  italic: string;
  underline: string;
  strike: string;
  code: string;
  link: string;
  pasteLink: string;
  linkAddress: string;
  applyLink: string;
  removeLink: string;
  color: string;
  text: string;
  highlight: string;
  defaultColor: string;
  colors: Record<(typeof TEXT_COLORS)[number], string>;
  comment: string;
}

export const DEFAULT_FORMAT_LABELS: FormatBubbleLabels = {
  bold: "Bold",
  italic: "Italic",
  underline: "Underline",
  strike: "Strikethrough",
  code: "Code",
  link: "Link",
  pasteLink: "Paste or type a link",
  linkAddress: "Link address",
  applyLink: "Apply",
  removeLink: "Remove link",
  color: "Colour",
  text: "Text",
  highlight: "Highlight",
  defaultColor: "Default",
  colors: {
    muted: "Grey",
    "swatch-red": "Red",
    "swatch-orange": "Orange",
    "swatch-amber": "Yellow",
    "swatch-emerald": "Green",
    "swatch-cyan": "Cyan",
    "swatch-blue": "Blue",
    "swatch-purple": "Purple",
    "swatch-pink": "Pink",
  },
  comment: "Comment",
};

const MOD = isMacOS ? "⌘" : "Ctrl+";

function Tool({
  icon: Icon,
  label,
  active,
  onClick,
  children,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-7 min-w-7 items-center justify-center gap-1 rounded-sm px-1 transition-colors",
        active ? "bg-accent-muted text-accent" : "text-text-muted hover:bg-surface-hover hover:text-text",
      )}
    >
      <Icon size={15} />
      {children}
    </button>
  );
}

/** Shown over any text selection: inline styles, colour, link and a comment on the words. */
export function FormatBubble({ editor, onComment, labels }: { editor: Editor; onComment?: () => void; labels: FormatBubbleLabels }) {
  const l = labels;
  const [panel, setPanel] = useState<"none" | "color" | "link">("none");
  const [url, setUrl] = useState("");
  // The editor never re-renders on its own transactions: refresh the active states here.
  const [, refresh] = useReducer((n: number) => n + 1, 0);
  const linkInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onSelection = () => {
      setPanel("none");
      refresh();
    };
    editor.on("selectionUpdate", onSelection);
    editor.on("transaction", refresh);
    return () => {
      editor.off("selectionUpdate", onSelection);
      editor.off("transaction", refresh);
    };
  }, [editor]);

  useEffect(() => {
    if (panel === "link") linkInput.current?.focus();
  }, [panel]);

  const chain = () => editor.chain().focus();
  const textColor = editor.getAttributes("textColor").color as string | undefined;
  const highlight = editor.getAttributes("highlight").color as string | undefined;

  const applyLink = () => {
    const href = url.trim();
    if (!href) chain().extendMarkRange("link").unsetLink().run();
    else
      chain()
        .extendMarkRange("link")
        .setLink({ href: /^[a-z][a-z0-9+.-]*:/i.test(href) ? href : `https://${href}` })
        .run();
    setPanel("none");
  };

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top", offset: 8, flip: true, shift: { padding: 8 } }}
      shouldShow={({ editor: ed, view, state, from, to }) => {
        const inMenu = !!document.activeElement?.closest("[data-format-bubble]");
        if (!(view.hasFocus() || inMenu) || state.selection.empty || !ed.isEditable) return false;
        if (ed.isActive("codeBlock") || !state.doc.textBetween(from, to).trim()) return false;
        // A selected link node or rule is a node, not text to format.
        return !("node" in state.selection);
      }}
      className="z-[70]"
    >
      <div data-format-bubble="" className="animate-modal-in flex flex-col rounded-lg border border-border bg-surface p-1 shadow-float">
        {panel === "link" ? (
          <form
            className="flex items-center gap-1 p-0.5"
            onSubmit={(e) => {
              e.preventDefault();
              applyLink();
            }}
          >
            <input
              ref={linkInput}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  e.stopPropagation();
                  setPanel("none");
                  editor.commands.focus();
                }
              }}
              placeholder={l.pasteLink}
              aria-label={l.linkAddress}
              className="h-7 w-56 rounded-sm border border-border bg-surface-raised px-2 text-sm text-text outline-none focus:border-accent"
            />
            <Tool icon={Check} label={l.applyLink} onClick={applyLink} />
            {editor.isActive("link") && (
              <Tool
                icon={Unlink}
                label={l.removeLink}
                onClick={() => {
                  chain().extendMarkRange("link").unsetLink().run();
                  setPanel("none");
                }}
              />
            )}
          </form>
        ) : (
          <div className="flex items-center gap-0.5">
            <Tool icon={Bold} label={`${l.bold} (${MOD}B)`} active={editor.isActive("bold")} onClick={() => chain().toggleBold().run()} />
            <Tool icon={Italic} label={`${l.italic} (${MOD}I)`} active={editor.isActive("italic")} onClick={() => chain().toggleItalic().run()} />
            <Tool icon={Underline} label={`${l.underline} (${MOD}U)`} active={editor.isActive("underline")} onClick={() => chain().toggleUnderline().run()} />
            <Tool icon={Strikethrough} label={l.strike} active={editor.isActive("strike")} onClick={() => chain().toggleStrike().run()} />
            <Tool icon={Code} label={l.code} active={editor.isActive("code")} onClick={() => chain().toggleCode().run()} />
            <span className="mx-0.5 h-5 w-px bg-border" />
            <Tool
              icon={Link2}
              label={l.link}
              active={editor.isActive("link")}
              onClick={() => {
                setUrl((editor.getAttributes("link").href as string | undefined) ?? "");
                setPanel("link");
              }}
            />
            <Tool
              icon={Baseline}
              label={l.color}
              active={panel === "color" || !!textColor || !!highlight}
              onClick={() => setPanel(panel === "color" ? "none" : "color")}
            >
              <span className="h-1 w-3 rounded-full" style={{ background: textColor ? colorVar(textColor) : "var(--color-text)" }} />
            </Tool>
            {onComment && (
              <>
                <span className="mx-0.5 h-5 w-px bg-border" />
                <Tool icon={MessageSquarePlus} label={`${l.comment} (${MOD}${isMacOS ? "⌥" : "Alt+"}M)`} onClick={onComment} />
              </>
            )}
          </div>
        )}
        {panel === "color" && (
          <div className="flex flex-col gap-2 border-t border-border px-1.5 pb-1 pt-2">
            <ColorRow
              label={l.text}
              labels={l}
              current={textColor}
              onPick={(c) => (c ? chain().setMark("textColor", { color: c }).run() : chain().unsetMark("textColor").run())}
              swatch={(c) => (
                <span className="text-sm font-medium" style={{ color: c ? `color-mix(in srgb, ${colorVar(c)} 78%, var(--color-text))` : "var(--color-text)" }}>
                  A
                </span>
              )}
            />
            <ColorRow
              label={l.highlight}
              labels={l}
              current={highlight}
              onPick={(c) => (c ? chain().setMark("highlight", { color: c }).run() : chain().unsetMark("highlight").run())}
              swatch={(c) => (
                <span
                  className="h-4 w-4 rounded-sm border border-border"
                  style={{ background: c ? `color-mix(in srgb, ${colorVar(c)} 30%, transparent)` : "transparent" }}
                />
              )}
            />
          </div>
        )}
      </div>
    </BubbleMenu>
  );
}

function ColorRow({
  label,
  labels,
  current,
  onPick,
  swatch,
}: {
  label: string;
  labels: FormatBubbleLabels;
  current?: string;
  onPick: (c: string | null) => void;
  swatch: (c: string | null) => ReactNode;
}) {
  const options: { name: string | null; label: string }[] = [
    { name: null, label: labels.defaultColor },
    ...TEXT_COLORS.map((name) => ({ name, label: labels.colors[name] })),
  ];
  return (
    <div>
      <p className="mb-1 text-[11px] text-text-muted">{label}</p>
      <div className="flex gap-0.5" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.name ?? "default"}
            type="button"
            role="radio"
            aria-checked={(current ?? null) === o.name}
            aria-label={o.label}
            title={o.label}
            onClick={() => onPick(o.name)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-sm transition-colors hover:bg-surface-hover",
              (current ?? null) === o.name && "bg-surface-hover ring-1 ring-border",
            )}
          >
            {swatch(o.name)}
          </button>
        ))}
      </div>
    </div>
  );
}
