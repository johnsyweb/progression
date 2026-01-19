import { defineConfig } from "vite";
import { htmlTransformPlugin } from "./src/server/htmlTransform";
import { buildPlugin } from "./src/server/buildPlugin";

const base = process.env.BASE_URL || "/progression/";
const siteUrl = base.startsWith("http") ? base : "https://www.johnsy.com";

export default defineConfig({
  base,
  root: "src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: "src/index.html",
        sw: "src/sw.ts",
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === "sw" ? "sw.js" : "[name]-[hash].js";
        },
        // Don't create shared chunks between main and sw to prevent cross-imports
        // The build plugin will inline all dependencies into sw.js
        manualChunks: (id) => {
          // Prevent any chunking that would create dependencies between main and sw
          // Each entry point should be self-contained
          return null;
        },
      },
    },
  },
  plugins: [
    htmlTransformPlugin(base),
    buildPlugin(siteUrl, base),
  ],
});
