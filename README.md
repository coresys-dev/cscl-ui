# cscl-ui

CoreSys's own shadcn-ui: a shared **source** library of UI components, hooks,
and design tokens, extracted and genericized from SLDR. Like shadcn-ui
itself, this is **not an npm dependency you install** — it's source you copy
into your app and own from that point on. There's no build step, no
published package, no version to be behind on. Pull in what you need, adapt
it if your app's needs diverge.

## Why

Every CoreSys app (SLDR today, others later) wants the same floating-panel,
dark-by-default, one-accent-color visual identity and the same interaction
patterns (a tree with drag-reorder, a settings modal shell, a toast system,
custom window chrome). Building each from scratch per app means drift and
duplicated bugs. `cscl-ui` is the shared substrate: copy a component in,
wire your app's real data/callbacks into its generic props, done.

## Using it

1. **Start with the theme.** Import `theme/tokens.css` then `theme/motion.css`
   in your app's main CSS file, in that order. Override `--color-accent` /
   `--color-accent-muted` and `--font-sans` for your app's brand — nothing
   else in `theme/tokens.css` should change per-app (see
   `D:\DEV\CORE-TOOLS\DESIGN-SYSTEM.md`, the canonical design doc this
   library encodes).
2. **Copy `lib/cn.ts`** — the classname-merge helper every component here
   uses.
3. **Copy whichever components/hooks you need**, folder by folder (below).
   Fix up the relative import paths to wherever you put them in your app.
   Install the peer dependencies listed in `package.json` your app doesn't
   already have (`class-variance-authority`, `clsx`, `tailwind-merge`,
   `lucide-react` — `@tauri-apps/api` only if you're using `window/` or
   `providers/SyncLinkProvider`).
4. **Wire up the generic props.** Nothing here imports app-specific types or
   calls your backend directly — every component takes plain data + callback
   props (and, instead of a baked-in i18n hook, a `labels` prop for its
   user-facing strings). That's the adaptation work; the rest (layout,
   animation, interaction) is already done.

## Folder structure

| Folder | What's in it |
|---|---|
| `theme/` | `tokens.css` (colors/radii/shadows/light-dark theming) + `motion.css` (shared easing + keyframes). The foundation everything else assumes. |
| `primitives/` | `Button`, `IconButton`, `Card`, `Switch`, `SegmentedControl`, `Chip`, `Slider` — the smallest reusable pieces, `cva`-variant driven. |
| `overlays/` | `ConfirmDialog`, `ContextMenu`, `IconPicker`, `DetailsDialog` — modal/popup patterns. |
| `feedback/` | `ToastProvider`, `InlineBanner`, `FatalErrorScreen`, `ProgressIndicator`, `JobRow`, `JobsPopover`, `LogConsole` — telling the user what's happening. |
| `data-display/` | `TreeView`/`TreeItem` (with pointer-based drag reorder/reparent), `ListView`/`ListRow`/`InlineRenameInput`, `Sparkline`, `Waveform` — showing collections of things. |
| `inputs/` | `Combobox`, `TagInput`, `ShortcutRecorder`, `HeroSearchInput` — things the user types into. |
| `navigation/` | `TabBar`, `SidebarTabsDialog` — moving between views. |
| `window/` | `TitleBar`, `WindowControls` — custom Tauri window chrome (see `window/README.md` for the required Rust-side command). |
| `providers/` | `SyncLinkProvider` — CoreSys-wide "CORE pushed a settings sync" listener (see `providers/README.md`). |
| `branding/` | `WordTicker`, `BootTransitionSplash` — the identity/startup-sequence pieces, content supplied by your app. |
| `lib/` | `cn.ts`, `retry.ts`, `mentionTrigger.ts`, `lucideIcons.ts`, `colorPalette.ts`, `hooks/*` — non-visual utilities and hooks everything above builds on. |

## A note on scope

Several source components in SLDR are genuinely app-specific (an audio
player transport bar, a folder-import flow, ffmpeg transcode UI) and were
**not** ported as-is — porting business logic wholesale would just leave
dead-on-arrival components nothing else could use. Instead, each one was
mined for its generic substrate: e.g. SLDR's `SettingsModal` (icon-rail tabs
+ settings panels) became `navigation/SidebarTabsDialog` (the shell only —
your app supplies the panels), and three near-identical toggle-pill
components scattered across SLDR collapsed into one `primitives/Chip`.

## Testing

`npm test` runs the plain-Node test suites (`lib/*.test.mjs`,
`data-display/*.test.mjs`) — currently covering the pure logic in
`lib/retry.ts` and `data-display/treeUtils.ts`. `npm run typecheck` type-checks
the whole tree against the peer dependencies (installed as devDependencies
here purely so this repo can typecheck itself standalone).
