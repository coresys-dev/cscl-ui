import { useMemo, useState, type ReactNode } from "react";
import { Clock, FileText, FolderOpen, LayoutGrid, Plus, Settings, Upload } from "lucide-react";
import {
  Badge,
  Button,
  calendarHeatmap,
  CommandPalette,
  Heatmap,
  MediaTransport,
  MonthGrid,
  Ring,
  Sparkline,
  TimeReadout,
  Timeline,
  WeekGrid,
  WeekStrip,
  WidgetGrid,
  Waveform,
  weekDays,
  type CalendarEntry,
  type Box,
} from "../../src";
import { MarkdownText } from "../../src/markdown";
import { RichTextEditor } from "../../src/editor";

export const SCENE2_HEIGHT: Record<string, number> = { palette: 620, calendar: 680, media: 460, dashboard: 640, editor: 620 };

function Frame({ id, children, className = "" }: { id: string; children: ReactNode; className?: string }) {
  return (
    <div className={`relative w-[1280px] shrink-0 overflow-hidden bg-bg ${className}`} style={{ height: SCENE2_HEIGHT[id] }}>
      {children}
    </div>
  );
}

const TODAY = "2026-11-06";
const MONDAY = "2026-11-02";

export function PaletteScene() {
  return (
    <Frame id="palette">
      <div className="grid grid-cols-3 gap-4 p-10 opacity-70">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-40 rounded-lg border border-border bg-surface" />
        ))}
      </div>
      <CommandPalette
        onClose={() => {}}
        groups={() => [
          {
            title: "Recent projects",
            items: [
              { key: "1", label: "Launch film", icon: FolderOpen, hint: "Today", badge: <Badge tone="accent">Live</Badge>, run: () => {} },
              { key: "2", label: "Brand refresh", icon: FolderOpen, hint: "Yesterday", badge: <Badge tone="attention">In review</Badge>, run: () => {} },
              { key: "3", label: "Podcast season 3", icon: FolderOpen, hint: "3 Nov", badge: <Badge tone="danger">Blocked</Badge>, run: () => {} },
            ],
          },
          { title: "Documents", items: [{ key: "d", label: "Shot list", icon: FileText, hint: "Launch film", run: () => {} }] },
          {
            title: "Actions",
            items: [
              { key: "n", label: "New project", icon: Plus, run: () => {} },
              { key: "o", label: "Open a space", icon: FolderOpen, run: () => {} },
              { key: "i", label: "Import a backup", icon: Upload, run: () => {} },
              { key: "s", label: "Settings", icon: Settings, run: () => {} },
            ],
          },
        ]}
      />
    </Frame>
  );
}

export function CalendarScene() {
  const [entries, setEntries] = useState<CalendarEntry[]>([
    { id: "a", date: "2026-11-03", start: "09:30", end: "11:00", title: "Edit review", subtitle: "Lea, Max", color: "var(--color-swatch-blue)" },
    { id: "b", date: "2026-11-03", start: "10:00", end: "10:45", title: "Call with the client", color: "var(--color-swatch-purple)" },
    { id: "c", date: "2026-11-05", start: "14:00", end: "16:30", title: "Colour grading", color: "var(--color-swatch-emerald)" },
    { id: "d", date: "2026-11-06", start: "08:30", end: "09:15", title: "Stand-up", color: "var(--color-swatch-amber)" },
    { id: "e", date: "2026-11-06", start: "11:00", end: "12:30", title: "Sound mix", subtitle: "Studio B" },
    { id: "f", date: "2026-11-04", title: "Delivery: Brand refresh", color: "var(--color-swatch-red)" },
  ]);
  return (
    <Frame id="calendar" className="grid grid-cols-[1fr_320px] gap-6 p-10">
      <WeekGrid
        weekStart={MONDAY}
        today={TODAY}
        entries={entries}
        onMove={(id, date, start) => setEntries((l) => l.map((e) => (e.id === id ? { ...e, date, start } : e)))}
        onResize={(id, end) => setEntries((l) => l.map((e) => (e.id === id ? { ...e, end } : e)))}
        onCreate={() => {}}
        onDayAdd={() => {}}
        locale="en-GB"
      />
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-border bg-surface">
          <MonthGrid defaultMonth={new Date(2026, 10, 6)} locale="en-GB" count={(iso) => (["2026-11-03", "2026-11-05", "2026-11-12", "2026-11-19"].includes(iso) ? 1 : 0)} />
        </div>
        <div className="rounded-lg border border-border bg-surface p-3">
          <WeekStrip days={weekDays(MONDAY)} today={TODAY} counts={[0, 2, 1, 4, 3, 0, 0]} locale="en-GB" />
        </div>
      </div>
    </Frame>
  );
}

const PEAKS = Array.from({ length: 220 }, (_, i) => {
  const a = Math.abs(Math.sin(i / 7) * Math.cos(i / 23)) * 0.9 + 0.05;
  return i % 2 ? a : -a;
});

export function MediaScene() {
  const [time, setTime] = useState(42);
  return (
    <Frame id="media" className="flex flex-col gap-6 p-10">
      <MediaTransport
        playing
        onToggle={() => {}}
        title="Kick_Analog_04.wav"
        meta={
          <>
            <span className="uppercase">wav</span>
            <span>48.0 kHz</span>
            <span>1.2 MB</span>
          </>
        }
        time="0:01 / 0:02"
        volume={0.7}
        onVolumeChange={() => {}}
      >
        <Waveform peaks={PEAKS} getFraction={() => 0.42} onSeek={() => {}} range={{ start: 0.2, end: 0.55 }} />
      </MediaTransport>
      <div className="rounded-lg border border-border bg-surface p-4 shadow-float">
        <div className="mb-3 flex h-40 items-center justify-center rounded-lg bg-black text-xs text-text-muted">VideoStage: a video plays here</div>
        <Timeline
          time={time}
          duration={180}
          onSeek={setTime}
          range={{ start: 60, end: 84 }}
          markers={[
            { id: "1", start: 12, label: "The cut feels too abrupt" },
            { id: "2", start: 95, end: 118, label: "Music too loud here" },
            { id: "3", start: 150, label: "Title in yellow", done: true },
          ]}
          activeMarkerId="2"
        />
        <p className="mt-1 font-mono text-xs tabular-nums text-text-muted">00:00:42:00 / 00:03:00:00</p>
      </div>
    </Frame>
  );
}

type W = Box & { kind: string };

export function DashboardScene() {
  const [widgets, setWidgets] = useState<W[]>([
    { id: "focus", kind: "focus", x: 0, y: 0, w: 3, h: 3 },
    { id: "storage", kind: "storage", x: 3, y: 0, w: 3, h: 3 },
    { id: "trend", kind: "trend", x: 6, y: 0, w: 6, h: 3 },
    { id: "heat", kind: "heat", x: 0, y: 3, w: 8, h: 3 },
    { id: "note", kind: "note", x: 8, y: 3, w: 4, h: 3 },
  ]);
  const activity = useMemo(() => {
    const m = new Map<string, number>();
    for (let i = 0; i < 240; i++) {
      const d = new Date(2026, 10, 6 - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const v = Math.round(Math.abs(Math.sin(i * 1.7) * 5 + Math.cos(i / 9) * 3));
      if (v > 1) m.set(iso, v);
    }
    return m;
  }, []);
  const names: Record<string, string> = { focus: "Focus timer", storage: "Storage", trend: "Activity", heat: "Contributions", note: "Note" };
  return (
    <Frame id="dashboard" className="p-10">
      <WidgetGrid
        widgets={widgets}
        editing
        onChange={setWidgets}
        onRemove={() => {}}
        onDuplicate={() => {}}
        onSettings={() => {}}
        label={(w) => names[w.kind]}
        renderWidget={(w) => {
          if (w.kind === "focus")
            return (
              <div className="flex h-full flex-col items-center justify-center">
                <TimeReadout seconds={1342} label="Focus" size="md" short />
              </div>
            );
          if (w.kind === "storage")
            return (
              <div className="flex h-full items-center justify-center gap-4">
                <Ring value={0.72}>
                  <span className="text-sm font-medium">72%</span>
                </Ring>
              </div>
            );
          if (w.kind === "trend")
            return (
              <div className="flex h-full flex-col justify-between p-4">
                <span className="flex items-center gap-2 text-sm text-text-muted">
                  <Clock size={14} /> Hours this week
                </span>
                <span className="text-2xl font-medium tabular-nums">31.5</span>
                <Sparkline values={[3, 5, 4, 6, 8, 7, 9, 12, 10, 13]} className="h-10 w-full" />
              </div>
            );
          if (w.kind === "heat")
            return (
              <div className="flex h-full flex-col justify-center p-3">
                <Heatmap fill values={calendarHeatmap(activity, TODAY, 34).map((r) => r.map((c) => (c ? c.value : null)))} />
              </div>
            );
          return (
            <div className="flex h-full flex-col gap-2 p-4 text-sm text-text-muted">
              <MarkdownText text={"**Friday**\n- Export the *launch film*\n- Send the invoice\n- Back up the space"} />
            </div>
          );
        }}
      />
      <div className="pointer-events-none absolute bottom-6 right-10 flex items-center gap-2 text-xs text-text-muted">
        <LayoutGrid size={14} /> Editing: drag to move, corner to resize
      </div>
    </Frame>
  );
}

const DOC = `<h1>Launch film</h1><p>Final delivery on <strong>Friday</strong>. The <span data-comment="c1" data-comment-text="Check with Max before sending" data-comment-at="2026-11-05T10:00:00Z" class="cs-comment">colour grade</span> is locked; the mix still needs a pass.</p><ul data-type="taskList"><li data-type="taskItem" data-checked="true"><p>Picture lock</p></li><li data-type="taskItem" data-checked="false"><p>Final mix</p></li><li data-type="taskItem" data-checked="false"><p>Subtitles, <mark data-highlight="swatch-amber">FR and EN</mark></p></li></ul><blockquote><p>Keep the opening under ten seconds.</p></blockquote><p>See <span data-doc-link="brief">Creative brief</span> and <span data-mention="cut">@cut_v3.mov</span>.</p>`;

export function EditorScene() {
  return (
    <Frame id="editor" className="flex justify-center p-10">
      <div className="w-[720px] rounded-lg border border-border bg-surface px-12 py-10 shadow-float">
        <RichTextEditor
          content={DOC}
          links={{ search: () => [{ id: "brief", title: "Creative brief" }], resolve: (id) => (id === "brief" ? { id, title: "Creative brief" } : null), open: () => {} }}
          mentions={{ search: () => [], resolve: (id) => (id === "cut" ? { id, label: "cut_v3.mov", hint: "3:05" } : null) }}
        />
        <div className="mt-4 flex justify-end">
          <Button size="sm" variant="secondary">
            Share
          </Button>
        </div>
      </div>
    </Frame>
  );
}
