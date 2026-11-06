import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Bell, Copy, Download, Folder, FolderOpen, Home, Inbox, LayoutGrid, Pencil, Plus, Search, Settings, Share2, Star, Trash2, Users } from "lucide-react";
import {
  Avatar,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Checkbox,
  Chip,
  ColorPicker,
  ConfirmDialog,
  CoresysMark,
  Donut,
  EmptyState,
  IconButton,
  InlineBanner,
  JobRow,
  Kbd,
  MOD,
  Menu,
  Popover,
  ProgressBar,
  RadioGroup,
  Ring,
  SegmentedControl,
  Select,
  Skeleton,
  Slider,
  Sparkline,
  Switch,
  Table,
  Tabs,
  TagInput,
  TextArea,
  TextField,
  ToastProvider,
  Tooltip,
  WordTicker,
  useToast,
  type MenuEntry,
} from "../../src";
import { WindowControls } from "../../src/tauri";
import { CalendarScene, DashboardScene, EditorScene, MediaScene, PaletteScene } from "./Scenes2";

// ── Fixtures ────────────────────────────────────────────────────────────────

type Project = { id: number; name: string; owner: string; status: "live" | "review" | "blocked" | "draft"; trend: number[]; updated: string };

const PROJECTS: Project[] = [
  { id: 1, name: "Launch film", owner: "Lea", status: "live", trend: [3, 4, 4, 6, 5, 8, 9, 12], updated: "2 min ago" },
  { id: 2, name: "Brand refresh", owner: "Max", status: "review", trend: [2, 3, 5, 4, 6, 6, 7, 7], updated: "1 h ago" },
  { id: 3, name: "Podcast season 3", owner: "Antoine", status: "blocked", trend: [8, 7, 7, 5, 4, 4, 3, 2], updated: "Yesterday" },
  { id: 4, name: "Store assets", owner: "Ines", status: "draft", trend: [1, 1, 2, 2, 3, 3, 3, 4], updated: "3 days ago" },
];

const STATUS: Record<Project["status"], { tone: "accent" | "attention" | "danger" | "neutral"; label: string }> = {
  live: { tone: "accent", label: "Live" },
  review: { tone: "attention", label: "In review" },
  blocked: { tone: "danger", label: "Blocked" },
  draft: { tone: "neutral", label: "Draft" },
};

const MENU: MenuEntry[] = [
  { type: "label", key: "l", label: "Launch film" },
  { type: "item", key: "open", label: "Open", icon: FolderOpen, onSelect: () => {} },
  { type: "item", key: "rename", label: "Rename", icon: Pencil, onSelect: () => {} },
  { type: "item", key: "dup", label: "Duplicate", icon: Copy, onSelect: () => {} },
  { type: "submenu", key: "share", label: "Share", icon: Share2, items: [{ type: "item", key: "link", label: "Copy link", onSelect: () => {} }] },
  { type: "checkbox-item", key: "fav", label: "Favorite", checked: true, onSelect: () => {} },
  { type: "separator", key: "s" },
  { type: "item", key: "del", label: "Delete", icon: Trash2, danger: true, onSelect: () => {} },
];

// ── Shell pieces ────────────────────────────────────────────────────────────

export const SCENE_HEIGHT: Record<string, number> = { hero: 760, primitives: 540, forms: 560, overlays: 600, dialog: 520, theming: 520 };

function Frame({ children, className = "", style, height = 760 }: { children: ReactNode; className?: string; style?: CSSProperties; height?: number }) {
  return (
    <div className={`relative w-[1280px] shrink-0 overflow-hidden bg-bg ${className}`} style={{ height, ...style }}>
      {children}
    </div>
  );
}

function Sidebar() {
  const items = [
    { icon: Home, label: "Home", active: false },
    { icon: LayoutGrid, label: "Projects", active: true },
    { icon: Inbox, label: "Inbox", badge: "3" },
    { icon: Users, label: "Team" },
    { icon: Settings, label: "Settings" },
  ];
  return (
    <aside className="absolute bottom-3 left-3 top-3 flex w-56 flex-col rounded-lg border border-border bg-surface p-3 shadow-float">
      <div className="px-1 pb-4 pt-2">
        <WordTicker words={["Plan.", "Build.", "Ship."]} />
      </div>
      <nav className="flex flex-col gap-0.5">
        {items.map(({ icon: Icon, label, active, badge }) => (
          <span
            key={label}
            className={`flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm ${active ? "bg-accent-muted text-accent" : "text-text-muted hover:bg-surface-hover hover:text-text"}`}
          >
            <Icon size={16} />
            <span className="flex-1">{label}</span>
            {badge && <Badge tone="attention">{badge}</Badge>}
          </span>
        ))}
      </nav>
      <div className="mt-auto flex items-center gap-2.5 rounded-md border border-border bg-surface-raised p-2.5">
        <Avatar name="Antoine" status="online" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-text">Antoine</p>
          <p className="truncate text-xs text-text-muted">Studio plan</p>
        </div>
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-text-muted">
        by <CoresysMark size={14} /> <span className="font-bold tracking-tight">coresys</span>
      </p>
    </aside>
  );
}

function WindowIsland() {
  return (
    <div className="absolute right-3 top-3 flex h-9 items-stretch overflow-hidden rounded-lg border border-border bg-surface shadow-float">
      <WindowControls />
    </div>
  );
}

function ToastOnMount({ message }: { message: string }) {
  const toast = useToast();
  const once = useRef(false);
  useEffect(() => {
    if (once.current) return;
    once.current = true;
    toast.showSuccess(message, { label: "Undo", run: () => {} });
  }, [toast, message]);
  return null;
}

// ── Scenes ──────────────────────────────────────────────────────────────────

function HeroScene() {
  const [view, setView] = useState<"list" | "board">("list");
  const [tab, setTab] = useState("projects");
  return (
    <Frame>
      <Sidebar />
      <WindowIsland />
      <main className="absolute bottom-3 left-[248px] right-3 top-[60px] flex flex-col gap-4 overflow-hidden rounded-lg border border-border bg-surface p-6 shadow-float">
        <div className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-1.5">
            <Breadcrumbs items={[{ label: "Studio", onClick: () => {} }, { label: "Projects" }]} />
            <h1 className="text-xl font-bold tracking-tight">Projects</h1>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip label="Search" shortcut={`${MOD} K`}>
              <IconButton aria-label="Search" variant="solid">
                <Search />
              </IconButton>
            </Tooltip>
            <Button variant="secondary">
              <Download /> Export
            </Button>
            <Button>
              <Plus /> New project
            </Button>
          </div>
        </div>
        <Tabs
          ariaLabel="Projects"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "projects", label: "All projects", count: 12 },
            { id: "mine", label: "Mine", count: 4 },
            { id: "archived", label: "Archived" },
          ]}
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Chip active>All</Chip>
            <Chip>Video</Chip>
            <Chip>Audio</Chip>
            <Chip>Design</Chip>
          </div>
          <SegmentedControl
            ariaLabel="View"
            value={view}
            onChange={setView}
            options={[
              { value: "list", label: "List" },
              { value: "board", label: "Board" },
            ]}
          />
        </div>
        <Table
          columns={[
            {
              key: "name",
              label: "Project",
              render: (p: Project) => (
                <span className="flex items-center gap-2">
                  <Folder size={14} className="text-text-muted" />
                  {p.name}
                </span>
              ),
            },
            { key: "status", label: "Status", render: (p: Project) => <Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge> },
            { key: "trend", label: "Activity", render: (p: Project) => <Sparkline values={p.trend} className="h-6 w-24" /> },
            {
              key: "owner",
              label: "Owner",
              render: (p: Project) => (
                <span className="flex items-center gap-2">
                  <Avatar name={p.owner} size="sm" />
                  {p.owner}
                </span>
              ),
            },
            { key: "updated", label: "Updated", align: "right", render: (p: Project) => <span className="text-text-muted">{p.updated}</span> },
          ]}
          rows={PROJECTS}
          getRowId={(p) => p.id}
        />
        <div className="grid grid-cols-3 gap-4">
          <Card className="flex items-center gap-4 p-4">
            <Ring value={0.72} size={56} stroke={6}>
              <span className="text-xs font-medium">72%</span>
            </Ring>
            <div>
              <p className="text-sm">Storage</p>
              <p className="text-xs text-text-muted">36 GB of 50 GB</p>
            </div>
          </Card>
          <Card className="p-4">
            <JobRow title="Rendering Launch film" description="Export 4K, H.265" state={{ kind: "running", processed: 312, total: 480 }} onCancel={() => {}} />
          </Card>
          <Card className="flex items-center gap-4 p-4">
            <Donut
              size={56}
              stroke={6}
              slices={[
                { count: 5, color: "var(--color-accent)" },
                { count: 3, color: "var(--color-accent-2)" },
                { count: 1, color: "var(--color-danger)" },
              ]}
            />
            <div>
              <p className="text-sm">9 tasks this week</p>
              <p className="text-xs text-text-muted">5 done · 3 open · 1 late</p>
            </div>
          </Card>
        </div>
      </main>
      <ToastOnMount message="Brand refresh moved to review." />
    </Frame>
  );
}

function PrimitivesScene() {
  const [on, setOn] = useState(true);
  const [vol, setVol] = useState(0.6);
  const [range, setRange] = useState<"day" | "week" | "month">("week");
  return (
    <Frame className="grid grid-cols-2 content-start gap-6 p-10" height={SCENE_HEIGHT.primitives}>
      <Panel title="Buttons">
        <div className="flex flex-wrap gap-2">
          <Button>Update now</Button>
          <Button variant="secondary">Later</Button>
          <Button variant="ghost">Skip</Button>
          <Button variant="destructive">Remove</Button>
          <Button variant="warning">Reinstall</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">
            <Plus /> New
          </Button>
          <Button size="sm" variant="secondary" disabled>
            Disabled
          </Button>
          <IconButton aria-label="Favorite" variant="solid">
            <Star />
          </IconButton>
          <IconButton aria-label="Notifications">
            <Bell />
          </IconButton>
          <IconButton aria-label="Delete" variant="danger">
            <Trash2 />
          </IconButton>
        </div>
      </Panel>
      <Panel title="Badges & chips">
        <div className="flex flex-wrap gap-2">
          <Badge>Draft</Badge>
          <Badge tone="accent">Installed</Badge>
          <Badge tone="attention">Update</Badge>
          <Badge tone="danger">Failed</Badge>
        </div>
        <div className="flex flex-wrap gap-1 rounded-md border border-border bg-surface-raised p-1">
          <Chip active>WAV</Chip>
          <Chip>MP3</Chip>
          <Chip>FLAC</Chip>
          <Chip active danger>
            Unthrottled
          </Chip>
        </div>
      </Panel>
      <Panel title="Toggles">
        <div className="flex items-center justify-between">
          <span className="text-sm">Launch at startup</span>
          <Switch checked={on} onChange={setOn} label="Launch at startup" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Range</span>
          <SegmentedControl
            ariaLabel="Range"
            value={range}
            onChange={setRange}
            options={[
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ]}
          />
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-sm">Volume</span>
          <div className="w-48">
            <Slider value={vol} onChange={setVol} ariaLabel="Volume" />
          </div>
        </div>
      </Panel>
      <Panel title="Feedback">
        <InlineBanner variant="success" message="Licence key redeemed." />
        <InlineBanner variant="warning" message="2 folders are missing." action={<Button size="sm" variant="secondary">Locate</Button>} />
        <InlineBanner message="Couldn't reach the update server." action={<Button size="sm" variant="secondary">Retry</Button>} />
        <div className="flex items-center gap-3">
          <ProgressBar value={0.64} />
          <Kbd keys={[MOD, "Shift", "P"]} />
        </div>
      </Panel>
    </Frame>
  );
}

function FormsScene() {
  const [stage, setStage] = useState("production");
  const [notify, setNotify] = useState(true);
  const [billing, setBilling] = useState<"hourly" | "fixed">("fixed");
  const [tags, setTags] = useState(["video", "client", "q4"]);
  const [color, setColor] = useState("#a78bfa");
  return (
    <Frame className="grid grid-cols-[1fr_1fr_300px] gap-6 p-10" height={SCENE_HEIGHT.forms}>
      <Panel title="New project">
        <TextField label="Name" placeholder="Untitled" defaultValue="Launch film" hint="Shown in the sidebar." leadingIcon={Folder} />
        <TextField label="Licence key" defaultValue="CSYS-4F2A-ZZ" error="This key is not valid." mono />
        <Select
          label="Stage"
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          options={[
            { value: "brief", label: "Brief" },
            { value: "production", label: "Production" },
            { value: "delivered", label: "Delivered" },
          ]}
        />
        <TextArea label="Notes" placeholder="What's this project about?" />
      </Panel>
      <Panel title="Details">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Tags</span>
          <TagInput tags={tags} vocabulary={["audio", "design"]} onAdd={(t) => setTags((l) => [...l, t])} onRemove={(t) => setTags((l) => l.filter((x) => x !== t))} />
        </div>
        <RadioGroup
          label="Billing"
          value={billing}
          onChange={setBilling}
          direction="row"
          options={[
            { value: "hourly", label: "Hourly" },
            { value: "fixed", label: "Fixed price" },
          ]}
        />
        <Checkbox label="Notify me" description="When a review comes in." checked={notify} onChange={setNotify} />
        <div className="mt-auto flex justify-end gap-2">
          <Button variant="secondary">Cancel</Button>
          <Button>Create project</Button>
        </div>
      </Panel>
      <Panel title="Colour">
        <ColorPicker value={color} onChange={setColor} />
      </Panel>
    </Frame>
  );
}

function OverlaysScene() {
  const bell = useRef<HTMLButtonElement>(null);
  const [menuAt, setMenuAt] = useState<{ x: number; y: number } | null>(null);
  const card = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const r = card.current?.getBoundingClientRect();
    if (r) setMenuAt({ x: r.left + 220, y: r.top + 70 });
  }, []);
  return (
    <Frame className="p-10" height={SCENE_HEIGHT.overlays}>
      <div className="grid grid-cols-3 gap-4">
        {PROJECTS.slice(0, 3).map((p, i) => (
          <Card key={p.id} interactive className="flex flex-col gap-3 p-4" {...(i === 0 ? { ref: card } : {})}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{p.name}</span>
              <Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge>
            </div>
            <Skeleton className="h-24 w-full" />
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span className="flex items-center gap-2">
                <Avatar name={p.owner} size="sm" /> {p.owner}
              </span>
              {p.updated}
            </div>
          </Card>
        ))}
      </div>
      {menuAt && <Menu x={menuAt.x} y={menuAt.y} items={MENU} onClose={() => {}} />}
      <div className="absolute bottom-10 right-10 flex flex-col items-end gap-3">
        <Popover open anchorRef={bell} onClose={() => {}} ariaLabel="Notifications" align="end" className="w-80">
          <p className="mb-2 text-sm font-medium">Notifications</p>
          <JobRow title="Rendering Launch film" state={{ kind: "running", processed: 312, total: 480 }} />
          <div className="mt-3 border-t border-border pt-3">
            <p className="text-sm">Max left a comment</p>
            <p className="text-xs text-text-muted">“Love the new cut.”</p>
          </div>
        </Popover>
        <Button ref={bell} variant="secondary">
          <Bell /> Notifications
        </Button>
      </div>
      <div className="absolute bottom-10 left-10 w-[420px]">
        <EmptyState icon={Inbox} title="No archived projects" description="Archive a project to keep it out of the way." />
      </div>
    </Frame>
  );
}

function DialogScene() {
  return (
    <Frame height={SCENE_HEIGHT.dialog}>
      <div className="grid grid-cols-3 gap-4 p-10">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i} className="h-40 border border-border" />
        ))}
      </div>
      <ConfirmDialog
        title="Remove this folder from your library?"
        body="This only removes it from the library: indexing, favorites and waveforms. Files on disk are never touched."
        confirmLabel="Remove"
        onConfirm={() => {}}
        onCancel={() => {}}
        content={
          <div className="mb-4">
            <Checkbox label="Also delete the cached previews" checked onChange={() => {}} />
          </div>
        }
      />
    </Frame>
  );
}

const ACCENTS: { name: string; accent: string; muted: string }[] = [
  { name: "Default", accent: "#f5f5f5", muted: "#262626" },
  { name: "Emerald", accent: "#38d49b", muted: "#1c4a3a" },
  { name: "Violet", accent: "#a78bfa", muted: "#2e2250" },
  { name: "Blue", accent: "#60a5fa", muted: "#16233a" },
];

function ThemingScene() {
  return (
    <Frame className="flex flex-col gap-6 p-10" height={SCENE_HEIGHT.theming}>
      <div className="grid grid-cols-4 gap-4">
        {ACCENTS.map((a) => (
          <div key={a.name} style={{ "--color-accent": a.accent, "--color-accent-muted": a.muted } as CSSProperties}>
            <ThemeSample label={a.name} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4" data-theme="light">
        <div data-theme="light" className="rounded-lg bg-bg p-4" style={LIGHT}>
          <ThemeSample label="Light theme" />
        </div>
        <div className="rounded-lg bg-bg p-4" style={{ ...LIGHT, "--color-accent": "#059669", "--color-accent-muted": "#d1fae5" } as CSSProperties}>
          <ThemeSample label="Light + emerald" />
        </div>
      </div>
    </Frame>
  );
}

// The light theme keys off <html data-theme>; this scene needs both side by side.
const LIGHT = {
  "--color-bg": "#fafafa",
  "--color-surface": "#ffffff",
  "--color-surface-raised": "#f9fafb",
  "--color-surface-hover": "#f3f4f6",
  "--color-border": "#e5e7eb",
  "--color-text": "#111111",
  "--color-text-muted": "#6b7280",
  "--color-accent": "#111111",
  "--color-accent-muted": "#e4e4e7",
  "--cs-shadow-card": "0 1px 2px 0 rgba(0,0,0,0.06), 0 4px 12px -4px rgba(0,0,0,0.08)",
  color: "#111111",
} as CSSProperties;

function ThemeSample({ label }: { label: string }) {
  const [on, setOn] = useState(true);
  const [v, setV] = useState<"a" | "b">("a");
  return (
    <Card className="flex flex-col gap-3 border border-border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text">{label}</span>
        <Badge tone="accent">Active</Badge>
      </div>
      <SegmentedControl
        value={v}
        onChange={setV}
        options={[
          { value: "a", label: "List" },
          { value: "b", label: "Grid" },
        ]}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">Sync</span>
        <Switch checked={on} onChange={setOn} label="Sync" />
      </div>
      <ProgressBar value={0.7} />
      <Button size="sm">Continue</Button>
    </Card>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 shadow-float">
      <h2 className="text-[11px] font-medium uppercase tracking-widest text-text-muted">{title}</h2>
      {children}
    </section>
  );
}

// ── Router ──────────────────────────────────────────────────────────────────

const SCENES: Record<string, { title: string; render: () => ReactNode }> = {
  hero: { title: "App shell", render: () => <HeroScene /> },
  primitives: { title: "Primitives", render: () => <PrimitivesScene /> },
  forms: { title: "Forms", render: () => <FormsScene /> },
  overlays: { title: "Menus & popovers", render: () => <OverlaysScene /> },
  dialog: { title: "Dialogs", render: () => <DialogScene /> },
  theming: { title: "Theming", render: () => <ThemingScene /> },
  palette: { title: "Command palette", render: () => <PaletteScene /> },
  calendar: { title: "Calendar", render: () => <CalendarScene /> },
  media: { title: "Media", render: () => <MediaScene /> },
  dashboard: { title: "Dashboard", render: () => <DashboardScene /> },
  editor: { title: "Editor", render: () => <EditorScene /> },
};

export function App() {
  const scene = new URLSearchParams(location.search).get("scene");
  if (scene && SCENES[scene]) return <ToastProvider>{SCENES[scene].render()}</ToastProvider>;
  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-xl font-bold">cscl-ui showroom</h1>
      <p className="text-sm text-text-muted">Every scene renders the library straight from ../src. Open one alone to capture it at 1280×760.</p>
      <ul className="flex flex-wrap gap-2">
        {Object.entries(SCENES).map(([id, s]) => (
          <li key={id}>
            <a className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-hover" href={`?scene=${id}`}>
              {s.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
