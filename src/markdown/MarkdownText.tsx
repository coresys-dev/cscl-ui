import { Fragment, type ReactNode } from "react";
import { marked, type Token, type Tokens } from "marked";

/* Markdown as React elements, never as an HTML string: whatever the text holds
 * is escaped by React. Raw HTML is shown as text, and links are drawn as
 * styled text (nothing here navigates). */

function inline(tokens: Token[] | undefined, fallback: string): ReactNode {
  if (!tokens) return fallback;
  return tokens.map((tok, i) => {
    switch (tok.type) {
      case "strong":
        return <strong key={i}>{inline((tok as Tokens.Strong).tokens, tok.raw)}</strong>;
      case "em":
        return <em key={i}>{inline((tok as Tokens.Em).tokens, tok.raw)}</em>;
      case "del":
        return <del key={i}>{inline((tok as Tokens.Del).tokens, tok.raw)}</del>;
      case "codespan":
        return (
          <code key={i} className="rounded-sm bg-surface-hover px-1 font-mono text-[0.9em]">
            {(tok as Tokens.Codespan).text}
          </code>
        );
      case "link":
        return (
          <span key={i} className="underline decoration-text-muted underline-offset-[3px]">
            {inline((tok as Tokens.Link).tokens, tok.raw)}
          </span>
        );
      case "br":
        return <br key={i} />;
      case "text":
      case "escape": {
        const sub = (tok as Tokens.Text).tokens;
        return <Fragment key={i}>{sub ? inline(sub, tok.raw) : (tok as Tokens.Text).text}</Fragment>;
      }
      default:
        return <Fragment key={i}>{tok.raw}</Fragment>;
    }
  });
}

function blocks(tokens: Token[]): ReactNode {
  return tokens.map((tok, i) => {
    switch (tok.type) {
      case "heading": {
        const h = tok as Tokens.Heading;
        return (
          <p key={i} className={h.depth <= 2 ? "mt-1 text-base font-medium text-text" : "mt-1 text-sm font-medium text-text"}>
            {inline(h.tokens, h.text)}
          </p>
        );
      }
      case "paragraph":
        return <p key={i}>{inline((tok as Tokens.Paragraph).tokens, (tok as Tokens.Paragraph).text)}</p>;
      case "text":
        return <p key={i}>{inline((tok as Tokens.Text).tokens, (tok as Tokens.Text).text)}</p>;
      case "list": {
        const l = tok as Tokens.List;
        const items = l.items.map((it, j) => <li key={j}>{blocks(it.tokens)}</li>);
        return l.ordered ? (
          <ol key={i} className="list-decimal pl-5">
            {items}
          </ol>
        ) : (
          <ul key={i} className="list-disc pl-5">
            {items}
          </ul>
        );
      }
      case "blockquote":
        return (
          <blockquote key={i} className="border-l-2 border-border pl-3 text-text-muted">
            {blocks((tok as Tokens.Blockquote).tokens)}
          </blockquote>
        );
      case "code":
        return (
          <pre key={i} className="overflow-hidden rounded-sm bg-surface-hover p-2 font-mono text-xs">
            {(tok as Tokens.Code).text}
          </pre>
        );
      case "hr":
        return <hr key={i} className="border-border" />;
      case "space":
        return null;
      default:
        return <p key={i}>{tok.raw}</p>;
    }
  });
}

/** Read-only Markdown (GFM) rendered as React elements: headings, lists, quotes,
 * code, emphasis. Safe for user text. Wrap it in your own text style and spacing
 * (e.g. `flex flex-col gap-2 text-sm text-text-muted`). */
export function MarkdownText({ text }: { text: string }) {
  return <>{blocks(marked.lexer(text, { gfm: true }))}</>;
}
