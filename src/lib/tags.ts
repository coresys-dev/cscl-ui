/** Splits typed or pasted text on commas into new tags: trimmed, non-empty,
 * not already in `existing`, no duplicates among themselves. */
export function splitTags(raw: string, existing: readonly string[]): string[] {
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const tag = part.trim();
    if (tag && !existing.includes(tag) && !out.includes(tag)) out.push(tag);
  }
  return out;
}
