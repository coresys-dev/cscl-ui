import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";

type Variant = "error" | "success" | "info";
interface ToastAction {
  label: string;
  run: () => void;
}
interface ToastItem {
  id: number;
  message: string;
  variant: Variant;
  actions: ToastAction[];
}
type ToastActions = ToastAction | ToastAction[];

interface ToastValue {
  showError: (msg: string) => void;
  showSuccess: (msg: string, action?: ToastActions) => void;
  showInfo: (msg: string, action?: ToastActions) => void;
}

const VARIANT: Record<Variant, string> = {
  error: "border-danger/40 text-danger",
  success: "border-accent/40 text-accent",
  info: "border-border text-text",
};

const Ctx = createContext<ToastValue | null>(null);
const DISMISS_MS = 6000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const push = useCallback((message: string, variant: Variant, action?: ToastActions) => {
    const id = ++seq.current;
    setItems((l) => [...l.slice(-4), { id, message, variant, actions: action ? [action].flat() : [] }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), DISMISS_MS);
  }, []);
  const value: ToastValue = {
    showError: useCallback((m: string) => push(m, "error"), [push]),
    showSuccess: useCallback((m: string, a?: ToastActions) => push(m, "success", a), [push]),
    showInfo: useCallback((m: string, a?: ToastActions) => push(m, "info", a), [push]),
  };
  return (
    <Ctx.Provider value={value}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex max-w-sm flex-col gap-2" aria-live="polite">
          {items.map((t) => (
            <div
              key={t.id}
              role={t.variant === "error" ? "alert" : "status"}
              className={cn(
                "animate-toast-in pointer-events-auto flex items-center gap-3 rounded-lg border bg-surface px-4 py-2 text-sm shadow-float",
                VARIANT[t.variant],
              )}
            >
              <span className="selectable min-w-0 flex-1 whitespace-pre-line">{t.message}</span>
              {t.actions.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  className="shrink-0 rounded-md px-2 py-0.5 text-xs font-medium text-text hover:bg-surface-hover"
                  onClick={() => {
                    a.run();
                    setItems((l) => l.filter((x) => x.id !== t.id));
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </Ctx.Provider>
  );
}

export function useToast(): ToastValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToast must be used within a ToastProvider");
  return v;
}
