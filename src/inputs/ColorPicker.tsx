import { useEffect, useState, type PointerEvent } from "react";
import { cn } from "../lib/cn";
import { hexToRgb, hsvToRgb, rgbToHex, rgbToHsv, type Hsv } from "../lib/colors";
import { fieldBox } from "./Field";

const hexToHsv = (hex: string): Hsv => rgbToHsv(hexToRgb(hex));
export const hsvToHex = (hsv: Hsv): string => rgbToHex(hsvToRgb(hsv));

const clamp = (x: number) => Math.min(1, Math.max(0, x));

/** Saturation/brightness area, hue slider and a HEX field. `onChange` fires live while dragging. */
export interface ColorPickerLabels {
  saturation: string;
  hue: string;
  hex: string;
}

const DEFAULT_LABELS: ColorPickerLabels = { saturation: "Saturation and brightness", hue: "Hue", hex: "Hex colour" };

/** Inline colour picker: saturation/brightness square, hue strip and a hex field, all keyboard-operable. */
export function ColorPicker({ value, onChange, labels }: { value: string; onChange: (hex: string) => void; labels?: Partial<ColorPickerLabels> }) {
  const l = { ...DEFAULT_LABELS, ...labels };
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value));
  const [text, setText] = useState(value.slice(1).toUpperCase());

  // Hue survives a trip through grey or black, where the hex alone no longer carries it.
  useEffect(() => {
    if (hsvToHex(hsv) !== value.toLowerCase()) {
      const next = hexToHsv(value);
      setHsv((cur) => (next.s === 0 || next.v === 0 ? { ...next, h: cur.h } : next));
    }
    setText(value.slice(1).toUpperCase());
  }, [value]);

  const set = (next: Hsv) => {
    setHsv(next);
    onChange(hsvToHex(next));
  };

  const drag = (fn: (x: number, y: number) => void) => {
    const at = (e: PointerEvent<HTMLDivElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      fn(clamp((e.clientX - r.left) / r.width), clamp((e.clientY - r.top) / r.height));
    };
    return {
      onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        at(e);
      },
      onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) at(e);
      },
    };
  };

  const hex = hsvToHex(hsv);

  return (
    <div className="flex w-56 flex-col gap-3">
      <div
        {...drag((x, y) => set({ ...hsv, s: x, v: 1 - y }))}
        role="slider"
        aria-label={l.saturation}
        aria-valuetext={`#${hex.slice(1).toUpperCase()}`}
        tabIndex={0}
        onKeyDown={(e) => {
          const d = e.shiftKey ? 0.1 : 0.02;
          const moves: Record<string, Partial<Hsv>> = {
            ArrowLeft: { s: clamp(hsv.s - d) },
            ArrowRight: { s: clamp(hsv.s + d) },
            ArrowUp: { v: clamp(hsv.v + d) },
            ArrowDown: { v: clamp(hsv.v - d) },
          };
          if (moves[e.key]) {
            e.preventDefault();
            set({ ...hsv, ...moves[e.key] });
          }
        }}
        className="relative h-36 w-full cursor-crosshair touch-none rounded-md"
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))` }}
      >
        <span
          className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: hex }}
        />
      </div>
      <div
        {...drag((x) => set({ ...hsv, h: Math.min(359.9, x * 360) }))}
        role="slider"
        aria-label={l.hue}
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(hsv.h)}
        tabIndex={0}
        onKeyDown={(e) => {
          const d = e.shiftKey ? 15 : 3;
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            set({ ...hsv, h: (hsv.h + (e.key === "ArrowRight" ? d : -d) + 360) % 360 });
          }
        }}
        className="relative h-3 w-full cursor-pointer touch-none rounded-full"
        style={{ background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}
      >
        <span
          className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
          style={{ left: `${(hsv.h / 360) * 100}%`, background: `hsl(${hsv.h} 100% 50%)` }}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="h-9 w-9 shrink-0 rounded-full border border-border" style={{ background: hex }} />
        {/* min-w-0: the input's intrinsic width would otherwise push the field past the panel. */}
        <label className={cn(fieldBox(), "min-w-0 flex-1")}>
          <span className="pl-2.5 text-sm text-text-muted">#</span>
          <input
            value={text}
            onChange={(e) => {
              const t = e.target.value
                .replace(/[^0-9a-f]/gi, "")
                .slice(0, 6)
                .toUpperCase();
              setText(t);
              if (t.length === 6) {
                const next = hexToHsv(`#${t}`);
                setHsv(next);
                onChange(`#${t.toLowerCase()}`);
              }
            }}
            onBlur={() => setText(hex.slice(1).toUpperCase())}
            onPaste={(e) => {
              const t = e.clipboardData.getData("text").trim().replace(/^#/, "");
              if (/^[0-9a-f]{3}$/i.test(t)) {
                e.preventDefault();
                const full = t
                  .split("")
                  .map((c) => c + c)
                  .join("")
                  .toUpperCase();
                setText(full);
                setHsv(hexToHsv(`#${full}`));
                onChange(`#${full.toLowerCase()}`);
              }
            }}
            aria-label={l.hex}
            spellCheck={false}
            className={cn(
              "h-full w-0 min-w-0 flex-1 bg-transparent pl-1 pr-2.5 font-mono text-sm uppercase text-text outline-none",
              text.length !== 6 && "text-text-muted",
            )}
          />
        </label>
      </div>
    </div>
  );
}
