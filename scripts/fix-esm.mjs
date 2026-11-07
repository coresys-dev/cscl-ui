// tsc (moduleResolution "bundler") emits extensionless relative imports, which Node's ESM loader
// rejects. Rewrite them in dist/ so the package also loads under `node --test` and SSR.
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith(".js") ? [join(d, e.name)] : []));

for (const file of walk("dist")) {
  const src = readFileSync(file, "utf8");
  const out = src.replace(/(\bfrom\s*|\bimport\s*\(\s*)(["'])(\.{1,2}\/[^"']*)\2/g, (m, pre, q, spec) => {
    const base = resolve(dirname(file), spec.replace(/\.tsx?$/, ""));
    const fixed = /\.(js|css|json)$/.test(spec) ? spec : existsSync(base + ".js") ? spec.replace(/\.tsx?$/, "") + ".js" : existsSync(join(base, "index.js")) ? spec.replace(/\/$/, "") + "/index.js" : null;
    if (!fixed) throw new Error(`${file}: cannot resolve ${spec}`);
    return `${pre}${q}${fixed}${q}`;
  });
  if (out !== src) writeFileSync(file, out);
}
