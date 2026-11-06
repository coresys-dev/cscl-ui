import { forwardRef, useEffect, useId, useLayoutEffect, useRef, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";
import { useOverlayStack } from "../overlays/Modal";

interface FieldShell {
  label?: ReactNode;
  /** Help text under the field. Replaced by `error` when both are set. */
  hint?: ReactNode;
  /** Error message: turns the border `danger` and sets `aria-invalid`. */
  error?: ReactNode;
  className?: string;
}

/** The bordered box every field draws: 36px, `radius-md`, 2px accent focus ring. */
export const fieldBox = (error?: unknown) =>
  cn(
    "relative flex min-h-9 w-full items-center rounded-md border bg-surface-raised transition-colors duration-150",
    "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent",
    error ? "border-danger" : "border-border hover:border-text-muted focus-within:border-accent",
  );

const control = "h-[34px] w-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-text outline-none select-text placeholder:text-text-muted";

function Shell({ id, label, hint, error, className, disabled, children }: FieldShell & { id: string; disabled?: boolean; children: ReactNode }) {
  const message = error || hint;
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", disabled && "pointer-events-none opacity-50", className)}>
      {label && (
        <label className="text-sm font-medium text-text" htmlFor={id}>
          {label}
        </label>
      )}
      {children}
      {message && (
        <p id={`${id}-hint`} className={cn("text-xs", error ? "text-danger" : "text-text-muted")}>
          {message}
        </p>
      )}
    </div>
  );
}

export type TextFieldProps = FieldShell &
  Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
    leadingIcon?: LucideIcon;
    /** Shown at the end of the field: a unit, a clear button. */
    trailing?: ReactNode;
    /** Monospace value (licence keys, paths). */
    mono?: boolean;
  };

/** Labelled single-line input. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, hint, error, className, trailing, leadingIcon: Icon, mono, id, ...rest }, ref) => {
    const auto = useId();
    const fid = id ?? auto;
    return (
      <Shell id={fid} label={label} hint={hint} error={error} className={className} disabled={rest.disabled}>
        <div className={fieldBox(error)}>
          {Icon && (
            <span className="inline-flex pl-3 text-text-muted" aria-hidden>
              <Icon size={16} />
            </span>
          )}
          <input
            ref={ref}
            id={fid}
            className={cn(control, Icon && "pl-2", mono && "font-mono")}
            aria-invalid={!!error || undefined}
            aria-describedby={hint || error ? `${fid}-hint` : undefined}
            {...rest}
          />
          {trailing && <span className="inline-flex items-center pr-2 text-text-muted">{trailing}</span>}
        </div>
      </Shell>
    );
  },
);
TextField.displayName = "TextField";

export type TextAreaProps = FieldShell & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className">;

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({ label, hint, error, className, id, ...rest }, ref) => {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Shell id={fid} label={label} hint={hint} error={error} className={className} disabled={rest.disabled}>
      <div className={cn(fieldBox(error), "items-stretch")}>
        <textarea
          ref={ref}
          id={fid}
          className={cn(control, "h-auto min-h-[88px] resize-y py-2")}
          aria-invalid={!!error || undefined}
          aria-describedby={hint || error ? `${fid}-hint` : undefined}
          {...rest}
        />
      </div>
    </Shell>
  );
});
TextArea.displayName = "TextArea";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type SelectProps = FieldShell & {
  value: string;
  /** Same shape as a native change event, so callers read `e.target.value`. */
  onChange?: (e: { target: { value: string } }) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
};

/** A field-styled dropdown drawn by the app (never the OS menu), with keyboard and type-ahead. */
export function Select({ label, hint, error, className, id, options, placeholder, value, onChange, disabled, "aria-label": ariaLabel }: SelectProps) {
  const auto = useId();
  const fid = id ?? auto;
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const all = placeholder !== undefined ? [{ value: "", label: placeholder }, ...options] : options;
  const current = all.find((o) => o.value === value);

  const pick = (v: string) => {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
    if (v !== value) onChange?.({ target: { value: v } });
  };

  return (
    <Shell id={fid} label={label} hint={hint} error={error} className={className} disabled={disabled}>
      <button
        ref={trigger}
        id={fid}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-invalid={!!error || undefined}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(fieldBox(error), "cursor-default text-left")}
      >
        <span className={cn("min-w-0 flex-1 truncate px-3 text-sm", !current || current.value === "" ? "text-text-muted" : "text-text")}>
          {current?.label ?? placeholder ?? ""}
        </span>
        <ChevronDown size={16} className={cn("mr-2.5 shrink-0 text-text-muted transition-transform duration-150", open && "rotate-180")} aria-hidden />
      </button>
      {open && trigger.current && <SelectList anchor={trigger.current} options={all} value={value} onPick={pick} onClose={() => setOpen(false)} />}
    </Shell>
  );
}

function SelectList({
  anchor,
  options,
  value,
  onPick,
  onClose,
}: {
  anchor: HTMLElement;
  options: SelectOption[];
  value: string;
  onPick: (v: string) => void;
  onClose: () => void;
}) {
  useOverlayStack(onClose);
  const list = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(() =>
    Math.max(
      0,
      options.findIndex((o) => o.value === value),
    ),
  );
  const [pos, setPos] = useState<{ left: number; top: number; width: number; maxHeight: number } | null>(null);
  const typed = useRef({ text: "", at: 0 });

  useLayoutEffect(() => {
    const r = anchor.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - 12;
    const above = r.top - 12;
    const want = Math.min(288, options.length * 34 + 10);
    const down = below >= want || below >= above;
    const maxHeight = Math.min(want, down ? below : above);
    const width = Math.max(r.width, 160);
    setPos({ left: Math.min(r.left, window.innerWidth - width - 8), top: down ? r.bottom + 4 : r.top - 4 - maxHeight, width, maxHeight });
    list.current?.focus({ preventScroll: true });
  }, [anchor, options.length]);

  useEffect(() => {
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  // The list is positioned once: anything scrolling underneath closes it.
  useEffect(() => {
    const onScroll = (e: Event) => !list.current?.contains(e.target as Node) && onClose();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onClose);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  const step = (from: number, d: number) => {
    for (let i = 1; i <= options.length; i++) {
      const j = (from + d * i + options.length) % options.length;
      if (!options[j].disabled) return j;
    }
    return from;
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[70]" onMouseDown={onClose} />
      <div
        ref={list}
        role="listbox"
        tabIndex={-1}
        style={pos ? { left: pos.left, top: pos.top, width: pos.width, maxHeight: pos.maxHeight } : { visibility: "hidden" }}
        className="animate-modal-in fixed z-[70] overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-float outline-none"
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => step(a, e.key === "ArrowDown" ? 1 : -1));
          } else if (e.key === "Home" || e.key === "End") {
            e.preventDefault();
            setActive(e.key === "Home" ? step(-1, 1) : step(options.length, -1));
          } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const o = options[active];
            if (o && !o.disabled) onPick(o.value);
          } else if (e.key === "Tab") {
            onClose();
          } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
            // Type-ahead: the first option starting with what was typed in the last second.
            const now = Date.now();
            typed.current = { text: (now - typed.current.at < 900 ? typed.current.text : "") + e.key.toLowerCase(), at: now };
            const i = options.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(typed.current.text));
            if (i >= 0) setActive(i);
          }
        }}
      >
        {options.map((o, i) => {
          const selected = o.value === value;
          return (
            <div
              key={o.value || "__empty"}
              role="option"
              aria-selected={selected}
              aria-disabled={o.disabled || undefined}
              data-index={i}
              onMouseMove={() => !o.disabled && active !== i && setActive(i)}
              onClick={() => !o.disabled && onPick(o.value)}
              className={cn(
                "flex h-8 items-center gap-2 rounded-md px-2.5 text-sm",
                o.disabled ? "text-text-muted opacity-50" : i === active ? "bg-surface-hover text-text" : "text-text",
                o.value === "" && "text-text-muted",
              )}
            >
              <span className="min-w-0 flex-1 truncate">{o.label}</span>
              {selected && <Check size={14} className="shrink-0 text-accent" />}
            </div>
          );
        })}
      </div>
    </>,
    document.body,
  );
}

const checkBox =
  "flex size-[18px] flex-none items-center justify-center rounded-sm border-[1.5px] border-text-muted text-bg transition-colors duration-150 group-hover:border-text peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent";

function CheckText({ label, description }: { label: ReactNode; description?: ReactNode }) {
  return (
    <span className="flex flex-col gap-0.5">
      <span className="text-sm text-text">{label}</span>
      {description && <span className="text-xs text-text-muted">{description}</span>}
    </span>
  );
}

export function Checkbox({
  label,
  description,
  checked,
  onChange,
  className,
  disabled,
}: {
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <label className={cn("group flex cursor-pointer items-start gap-2.5", disabled && "pointer-events-none opacity-50", className)}>
      <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className={cn(checkBox, "mt-px peer-checked:border-accent peer-checked:bg-accent [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100")} aria-hidden>
        <Check size={14} strokeWidth={3} className="transition-opacity duration-150" />
      </span>
      <CheckText label={label} description={description} />
    </label>
  );
}

export function RadioGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  direction = "column",
  name,
}: {
  label?: ReactNode;
  options: { value: T; label: ReactNode; description?: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  direction?: "row" | "column";
  name?: string;
}) {
  const auto = useId();
  const group = name ?? auto;
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-2.5 border-0 p-0">
      {label && <legend className="mb-2.5 text-sm font-medium text-text">{label}</legend>}
      <div className={cn("flex", direction === "row" ? "flex-row flex-wrap gap-x-6 gap-y-3" : "flex-col gap-3")}>
        {options.map((o) => (
          <label key={o.value} className="group flex cursor-pointer items-start gap-2.5">
            <input type="radio" name={group} value={o.value} className="peer sr-only" checked={value === o.value} onChange={() => onChange(o.value)} />
            <span className={cn(checkBox, "mt-px rounded-full peer-checked:border-accent [&>span]:scale-0 peer-checked:[&>span]:scale-100")} aria-hidden>
              <span className="size-2 rounded-full bg-accent transition-transform duration-150" />
            </span>
            <CheckText label={o.label} description={o.description} />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Small section label used above groups of controls. */
export function Label({ children, className, htmlFor }: { children: ReactNode; className?: string; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("block text-sm font-medium text-text", className)}>
      {children}
    </label>
  );
}
