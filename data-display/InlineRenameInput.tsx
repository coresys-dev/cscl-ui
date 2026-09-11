import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/cn";

interface InlineRenameInputProps {
  initialValue: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  className?: string;
}

/** Text field for inline rename: focuses and selects all its text on mount,
 * Enter submits the trimmed value (or cancels if it's empty), Escape and
 * blur cancel. Extracted from three near-identical copies duplicated across
 * SLDR's folder tree and file rows — use this instead of re-copying it again. */
export function InlineRenameInput({ initialValue, onSubmit, onCancel, className }: InlineRenameInputProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") {
          const trimmed = value.trim();
          if (trimmed) onSubmit(trimmed);
          else onCancel();
        } else if (e.key === "Escape") {
          onCancel();
        }
      }}
      onBlur={onCancel}
      className={cn(
        "min-w-0 flex-1 rounded-sm border border-accent bg-bg px-2 py-1 text-sm text-text outline-none",
        className,
      )}
    />
  );
}
