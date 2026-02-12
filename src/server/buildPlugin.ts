import type { Plugin } from "vite";
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  copyFileSync,
  mkdirSync,
  statSync,
} from "fs";
import { join, resolve } from "path";
import { generateSitemap } from "../utils/generateSitemap";

function copyDirectory(source: string, destination: string): void {
  mkdirSync(destination, { recursive: true });
  const entries = readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = join(source, entry.name);
    const destPath = join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      copyFileSync(sourcePath, destPath);
    }
  }
}

export function buildPlugin(baseUrl: string, basePath: string): Plugin {
  return {
    name: "build-plugin",
    writeBundle(options) {
      if (options.dir) {
        const htmlPath = join(options.dir, "index.html");

        try {
          let html = readFileSync(htmlPath, "utf-8");

          if (basePath !== "/") {
            const normalizedBasePath = `/${basePath.replace(/^\/|\/$/g, "")}/`;
            const baseTag = `<base href="${normalizedBasePath}" />`;
            html = html.replace(/<head>/, `<head>\n    ${baseTag}`);
          }

          writeFileSync(htmlPath, html);

          const notFoundHtmlPath = join(options.dir, "404.html");
          writeFileSync(notFoundHtmlPath, html);

          const sitemap = generateSitemap(baseUrl, basePath);
          const sitemapPath = join(options.dir, "sitemap.xml");
          writeFileSync(sitemapPath, sitemap);

          const assetsSourceDir = resolve(process.cwd(), "assets");
          const assetsDestDir = join(options.dir, "assets");
          try {
            const sourceStat = statSync(assetsSourceDir);
            if (sourceStat.isDirectory()) {
              copyDirectory(assetsSourceDir, assetsDestDir);
            }
          } catch {
            // Assets directory might not exist
          }
        } catch {
          // File might not exist yet
        }
      }
    },
  };
}
