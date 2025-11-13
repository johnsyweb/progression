import { defineConfig } from "vite";
import { htmlTransformPlugin } from "./src/server/htmlTransform";
import { buildPlugin } from "./src/server/buildPlugin";

const base = process.env.BASE_URL || "/";
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] || "progression";
const owner = process.env.GITHUB_REPOSITORY_OWNER || "yourusername";
const githubPagesUrl =
  base === "/"
    ? `https://${owner}.github.io/${repoName}`
    : base.startsWith("http")
      ? base
      : `https://${owner}.github.io${base}`;

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
          return chunkInfo.name === "sw" ? "sw.js" : "[name].js";
        },
      },
    },
  },
  plugins: [
    htmlTransformPlugin(),
    buildPlugin(githubPagesUrl),
  ],
});
