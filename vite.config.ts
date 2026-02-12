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
      input: "src/index.html",
      output: {
        entryFileNames: "[name]-[hash].js",
      },
    },
  },
  plugins: [
    htmlTransformPlugin(base),
    buildPlugin(siteUrl, base),
  ],
});
