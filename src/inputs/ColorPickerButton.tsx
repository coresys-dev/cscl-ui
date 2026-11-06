import { useRef, useState, type RefObject } from "react";
import { cn } from "../lib/cn";
import { hexToRgb, hsvToHsl, hsvToRgb, hslToHsv, parseHex, rgbToHex, rgbToHsv, type Hsv } from "../lib/colors";
import { Popover } from "../overlays/Popover";

const SIZE = 176;
const RING = 16;
const SQUARE = 100;
const MODES = ["HEX", "RGB", "HSL"] as const;

/** A hue ring around a saturation/brightness square, with the value also readable and typable as HEX, RGB or HSL. */
function ColorWheel({
  anchorRef,
  value,
  onChange,
  onClose,
  label,
}: {
  anchorRef: RefObject<HTMLButtonElement | null>;
  value: string;
  onChange: (hex: string) => void;
  onClose: () => void;
  label: string;
}) {
  const [hsv, setHsv] = useState<Hsv>(() => rgbToHsv(hexToRgb(value)));
  const [mode, setMode] = useState<(typeof MODES)[number]>("HEX");
  const drag = useRef<"hue" | "sv" | null>(null);
  const rgb = hsvToRgb(hsv);
  const hsl = hsvToHsl(hsv);
  const hex = rgbToHex(rgb);

  const set = (next: Hsv) => {
    setHsv(next);
    onChange(rgbToHex(hsvToRgb(next)));
  };
  // A typed colour: a grey or black has no hue of its own, so the one on screen stays.
  const setFromRgb = (c: { r: number; g: number; b: number }) => {
    const n = rgbToHsv(c);
    set(n.s === 0 || n.v === 0 ? { ...n, h: hsv.h } : n);
  };
  const point = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - box.left - SIZE / 2;
    const dy = e.clientY - box.top - SIZE / 2;
    if (e.type === "pointerdown") drag.current = Math.abs(dx) <= SQUARE / 2 && Math.abs(dy) <= SQUARE / 2 ? "sv" : "hue";
    if (drag.current === "hue") set({ ...hsv, h: ((Math.atan2(dy, dx) * 180) / Math.PI + 450) % 360 });
    else if (drag.current === "sv") set({ ...hsv, s: Math.min(1, Math.max(0, dx / SQUARE + 0.5)), v: Math.min(1, Math.max(0, 0.5 - dy / SQUARE)) });
  };
  const hueAngle = ((hsv.h - 90) * Math.PI) / 180;
  const mid = SIZE / 2 - RING / 2;

  const field = (name: string, current: number, max: number, commit: (n: number) => void) => (
    <label key={name} className="flex min-w-0 flex-1 flex-col items-center gap-0.5 text-[10px] text-text-muted">
      <input
        // Re-read from the colour whenever it changes elsewhere; a typed value counts when it is left or confirmed.
        key={current}
        defaultValue={current}
        inputMode="numeric"
        aria-label={name}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        onBlur={(e) => {
          const n = Number(e.currentTarget.value);
          if (e.currentTarget.value.trim() !== "" && Number.isFinite(n)) commit(Math.min(max, Math.max(0, n)));
          else e.currentTarget.value = String(current);
        }}
        className="h-7 w-full rounded-md border border-border bg-surface-raised px-1 text-center text-xs tabular-nums text-text outline-none focus:border-accent"
      />
      {name}
    </label>
  );

  return (
    <Popover open anchorRef={anchorRef} ariaLabel={label} onClose={onClose} className="w-52">
      {/* Keeps the text being edited open while a field here has the focus. */}
      <div data-keep-editing className="flex flex-col items-center gap-3">
        <div
          className="relative touch-none select-none"
          style={{ width: SIZE, height: SIZE }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            point(e);
          }}
          onPointerMove={(e) => drag.current && point(e)}
          onPointerUp={() => (drag.current = null)}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
              mask: `radial-gradient(farthest-side, transparent calc(100% - ${RING}px), #000 calc(100% - ${RING - 1}px))`,
              WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${RING}px), #000 calc(100% - ${RING - 1}px))`,
            }}
          />
          <div
            className="absolute rounded-md"
            style={{
              left: (SIZE - SQUARE) / 2,
              top: (SIZE - SQUARE) / 2,
              width: SQUARE,
              height: SQUARE,
              background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))`,
            }}
          />
          <span
            className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,.4)]"
            style={{ left: SIZE / 2 + Math.cos(hueAngle) * mid, top: SIZE / 2 + Math.sin(hueAngle) * mid, background: `hsl(${hsv.h} 100% 50%)` }}
          />
          <span
            className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,.4)]"
            style={{ left: (SIZE - SQUARE) / 2 + hsv.s * SQUARE, top: (SIZE - SQUARE) / 2 + (1 - hsv.v) * SQUARE, background: hex }}
          />
        </div>
        <div className="flex w-full items-center gap-2">
          <span className="h-7 w-7 shrink-0 rounded-md border border-border" style={{ background: hex }} aria-hidden />
          <div className="flex gap-0.5 rounded-md bg-surface-raised p-0.5" role="group" aria-label={label} onMouseDown={(e) => e.preventDefault()}>
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={cn("rounded px-1.5 py-1 text-[10px] font-medium text-text-muted", mode === m && "bg-accent-muted text-accent")}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="flex w-full gap-1">
          {mode === "HEX" && (
            <label className="flex flex-1 flex-col items-center gap-0.5 text-[10px] text-text-muted">
              <input
                key={hex}
                defaultValue={hex}
                aria-label="HEX"
                spellCheck={false}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                onBlur={(e) => {
                  const h = parseHex(e.currentTarget.value);
                  if (h) setFromRgb(hexToRgb(h));
                  else e.currentTarget.value = hex;
                }}
                className="h-7 w-full rounded-md border border-border bg-surface-raised px-2 text-center text-xs uppercase tabular-nums text-text outline-none focus:border-accent"
              />
              HEX
            </label>
          )}
          {mode === "RGB" && (["r", "g", "b"] as const).map((k) => field(k.toUpperCase(), rgb[k], 255, (n) => setFromRgb({ ...rgb, [k]: n })))}
          {mode === "HSL" && [
            field("H", Math.round(hsl.h), 360, (n) => set(hslToHsv({ ...hsl, h: n }))),
            field("S", Math.round(hsl.s * 100), 100, (n) => set(hslToHsv({ ...hsl, h: hsv.h, s: n / 100 }))),
            field("L", Math.round(hsl.l * 100), 100, (n) => set(hslToHsv({ ...hsl, h: hsv.h, l: n / 100 }))),
          ]}
        </div>
      </div>
    </Popover>
  );
}

/** A rainbow swatch that opens the picker; ringed when `active` (the colour in use is not one of the others). */
export function ColorPickerButton({
  value,
  active,
  onChange,
  onOpen,
  onClose,
  label,
  className,
}: {
  value: string;
  active?: boolean;
  onChange: (hex: string) => void;
  onOpen?: () => void;
  onClose?: () => void;
  label: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="dialog"
        ref={button}
        onClick={() => {
          if (open) return;
          onOpen?.();
          setOpen(true);
        }}
        style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}
        className={cn("rounded-full", active && "ring-2 ring-text ring-offset-1 ring-offset-surface-raised", className)}
      />
      {open && (
        <ColorWheel
          anchorRef={button}
          value={value}
          label={label}
          onChange={onChange}
          onClose={() => {
            setOpen(false);
            onClose?.();
          }}
        />
      )}
    </>
  );
}
