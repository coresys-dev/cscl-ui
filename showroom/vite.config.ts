import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Renders the library straight from ../src: no build step between an edit and the page.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ["react", "react-dom", "class-variance-authority", "clsx", "tailwind-merge", "lucide-react"],
    // Nothing native runs in a browser tab.
    alias: [{ find: /^@tauri-apps\/api\/.*/, replacement: path.resolve(__dirname, "src/tauri-mock.ts") }],
  },
  server: { fs: { allow: [path.resolve(__dirname, "..")] } },
});
