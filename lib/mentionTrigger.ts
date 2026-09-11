/** Detects an active mention trigger (`@folder`, `#tag`, …) ending at the
 * cursor: the trigger at the very start of the text, or preceded by
 * whitespace. If another trigger appears closer to the cursor (inside the
 * text typed after ours), it has taken over — our mention is considered
 * closed rather than swallowing its text. Pass the trigger character to
 * detect (e.g. `"@"`) and the other trigger character your field also
 * recognizes (e.g. `"#"`) so the two can hand off cleanly in a shared input. */
export function detectMention(
  text: string,
  cursor: number,
  trigger: string,
  otherTrigger: string,
): { start: number; raw: string } | null {
  const upToCursor = text.slice(0, cursor);
  const at = upToCursor.lastIndexOf(trigger);
  if (at === -1) return null;
  if (at > 0 && !/\s/.test(upToCursor[at - 1])) return null;
  const raw = upToCursor.slice(at + 1);
  if (raw.includes(otherTrigger)) return null;
  return { start: at, raw };
}
