// Captures every showroom scene to docs/showroom/<scene>.png (2x) with a headless
// Chromium (Edge on Windows by default). Run with the showroom dev server up:
//   pnpm dev   (in another terminal)
//   node capture.mjs [browserPath]
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const SCENES = { hero: 760, primitives: 540, forms: 560, overlays: 600, dialog: 520, theming: 520, palette: 620, calendar: 680, media: 460, dashboard: 640, editor: 620 };
const browser = process.argv[2] ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const out = resolve(import.meta.dirname, "../docs/showroom");
mkdirSync(out, { recursive: true });

for (const [scene, height] of Object.entries(SCENES)) {
  const file = resolve(out, `${scene}.png`);
  execFileSync(browser, [
    "--headless=new",
    "--hide-scrollbars",
    "--force-device-scale-factor=2",
    `--window-size=1280,${height}`,
    "--virtual-time-budget=2500",
    `--screenshot=${file}`,
    `http://localhost:5198/?scene=${scene}`,
  ]);
  console.log(file);
}
