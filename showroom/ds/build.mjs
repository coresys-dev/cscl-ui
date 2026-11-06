// Builds the CoreSys design system's component files from this repository:
//   node ds/build.mjs <design-system folder>
// writes <folder>/project/components/{bundle.js,bundle.css,index.d.ts}. Previews
// already in <folder>/project/components/*/preview.html are scanned for classes.
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const here = import.meta.dirname;
const repo = resolve(here, "../..");
const out = resolve(process.argv[2] ?? "", "project/components");
statSync(out); // fail early on a wrong folder

// Components shown as cards, in catalogue order.
const COMPONENTS = [
  "Button", "IconButton", "Badge", "Card", "Chip", "SegmentedControl", "Switch", "Slider", "Kbd",
  "TextField", "Select", "Checkbox", "RadioGroup", "TagInput", "Combobox", "HeroSearchInput", "ShortcutRecorder", "ColorPicker", "ColorPickerButton",
  "Modal", "ConfirmDialog", "DialogsProvider", "ConsentDialog", "DetailsDialog", "UpdateDialog", "IconPicker", "Menu", "DropdownMenu", "Popover", "Tooltip",
  "ToastProvider", "InlineBanner", "EmptyState", "ErrorState", "FatalErrorScreen", "Skeleton", "ProgressBar", "ProgressIndicator", "JobRow", "JobsPopover", "LogConsole",
  "Avatar", "Table", "TreeView", "ListView", "ListRow", "InlineRenameInput", "Sparkline", "MiniWaveform", "Waveform", "Ring", "Donut", "ImageCaption", "CreditsList",
  "Tabs", "Breadcrumbs", "TabBar", "SidebarTabsDialog", "TitleBar", "WindowControls",
  "CoresysMark", "WordTicker", "BootTransitionSplash",
  "SiteHeader", "Hero", "ProductRow", "FeatureGrid", "SiteFooter", "Pagination", "Link", "Accordion",
  "CommandPalette", "CommentCard", "FileDropOverlay", "Heatmap", "TimeReadout", "MediaTransport", "Timeline", "VideoStage",
  "WeekGrid", "MonthGrid", "WeekStrip", "WidgetGrid", "RichTextEditor", "MarkdownText",
];

// React, ReactDOM and the JSX runtime come from the page's globals (React 18).
const globals = {
  name: "react-globals",
  setup(b) {
    b.onResolve({ filter: /^(react|react-dom|react-dom\/client|react\/jsx-runtime)$/ }, (a) => ({ path: a.path, namespace: "g" }));
    b.onResolve({ filter: /^@tauri-apps\/api\// }, () => ({ path: resolve(here, "../src/tauri-mock.ts") }));
    b.onLoad({ filter: /.*/, namespace: "g" }, (a) => ({
      loader: "js",
      contents:
        a.path === "react/jsx-runtime"
          ? `const R = window.React;
             const make = (many) => (type, { children, ...props }, key) => {
               if (key !== undefined) props.key = key;
               return children === undefined ? R.createElement(type, props) : many ? R.createElement(type, props, ...children) : R.createElement(type, props, children);
             };
             export const Fragment = R.Fragment, jsx = make(false), jsxs = make(true);`
          : `module.exports = ${a.path === "react" ? "window.React" : "window.ReactDOM"};`,
    }));
  },
};

const header = `/* @ds-bundle: ${JSON.stringify({ format: 4, namespace: "CoreSys", components: COMPONENTS.map((name) => ({ name })) })} */\n`;
const js = await build({
  entryPoints: [resolve(here, "entry.ts")],
  bundle: true,
  format: "iife",
  minify: true,
  write: false,
  target: "es2020",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [globals],
});
const code = js.outputFiles[0].text.replaceAll("</script", "<\\/script").replaceAll("<!--", "<\\!--");
writeFileSync(join(out, "bundle.js"), header + code);

// Stylesheet: the library's tokens, motion and base, and every utility the library and the previews use.
const css = join(here, ".bundle.css");
const src = (p) => relative(here, p).replaceAll("\\", "/");
writeFileSync(
  css,
  `@import "tailwindcss";\n@import "${src(join(repo, "theme/index.css"))}";\n@import "${src(join(repo, "theme/editor.css"))}";\n@source "${src(join(repo, "src"))}";\n@source "${src(out)}";\n@theme { --font-sans: "Sora", ui-sans-serif, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }\n`,
);
execFileSync(process.execPath, [resolve(here, "../node_modules/@tailwindcss/cli/dist/index.mjs"), "-i", css, "-o", join(out, "bundle.css"), "--minify"], { stdio: "inherit" });

// Types: the library's declarations, one block per file.
const dist = join(repo, "dist");
const files = [];
const walk = (d) => readdirSync(d).forEach((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : f.endsWith(".d.ts") && files.push(join(d, f))));
walk(dist);
const blocks = files
  .filter((f) => !/[\\/](index|tauri|editor|markdown)\.d\.ts$/.test(f))
  .sort()
  .map((f) => `// ${relative(dist, f).replaceAll("\\", "/").replace(/\.d\.ts$/, ".tsx")}\n` + readFileSync(f, "utf8").replace(/^\/\/# sourceMappingURL=.*$/m, "").trim());
writeFileSync(
  join(out, "index.d.ts"),
  `// CoreSys — window.CoreSys, built from coresys-dev/cscl-ui v2 (src/). Icons: every lucide-react icon as CoreSys.Icons.\n// Documentation only: these declarations are not type-checked here.\n\n` +
    blocks.join("\n\n") +
    "\n",
);
console.log(`bundle.js ${(statSync(join(out, "bundle.js")).size / 1024) | 0} KB, bundle.css ${(statSync(join(out, "bundle.css")).size / 1024) | 0} KB, index.d.ts ${files.length} files`);
