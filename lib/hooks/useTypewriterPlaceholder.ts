import { useEffect, useState } from "react";

const TYPE_MS = 55;
const DELETE_MS = 30;
const HOLD_MS = 1300;
const PAUSE_MS = 350;
const CURSOR_BLINK_MS = 450;

type Phase = "typing" | "holding" | "deleting" | "pausing";

/** Typewriter effect: types a word letter by letter, holds, deletes it, then
 * moves to the next in a loop. `words` must be a stable reference (a module
 * constant, or memoized) — otherwise the effect resets on every render. The
 * cursor blinks on its own timer, independent of typing, so it stays visible
 * during holds/pauses. */
export function useTypewriterPlaceholder(words: readonly string[]): string {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");
  const [cursorOn, setCursorOn] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCursorOn((v) => !v), CURSOR_BLINK_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (words.length === 0) return;
    const word = words[wordIndex % words.length];

    if (phase === "typing") {
      if (text.length < word.length) {
        const timer = setTimeout(() => setText(word.slice(0, text.length + 1)), TYPE_MS);
        return () => clearTimeout(timer);
      }
      setPhase("holding");
      return;
    }

    if (phase === "holding") {
      const timer = setTimeout(() => setPhase("deleting"), HOLD_MS);
      return () => clearTimeout(timer);
    }

    if (phase === "deleting") {
      if (text.length > 0) {
        const timer = setTimeout(() => setText(word.slice(0, text.length - 1)), DELETE_MS);
        return () => clearTimeout(timer);
      }
      setPhase("pausing");
      return;
    }

    // phase === "pausing"
    const timer = setTimeout(() => {
      setWordIndex((i) => (i + 1) % words.length);
      setPhase("typing");
    }, PAUSE_MS);
    return () => clearTimeout(timer);
  }, [words, wordIndex, text, phase]);

  return text + (cursorOn ? "|" : " ");
}
