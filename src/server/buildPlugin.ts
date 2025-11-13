import type { Plugin } from "vite";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { generateFallbackSVG } from "../utils/generateFallbackSVG";

export function buildPlugin(baseUrl: string, basePath: string): Plugin {
  return {
    name: "build-plugin",
    writeBundle(options) {
      if (options.dir) {
        const htmlPath = join(options.dir, "index.html");
        const fallbackSvgPath = join(options.dir, "og-image-fallback.svg");

        try {
          // Generate and write fallback SVG
          const fallbackSvg = generateFallbackSVG();
          writeFileSync(fallbackSvgPath, fallbackSvg);

          // Create static og-image.svg file for GitHub Pages
          // This ensures direct requests (e.g., from crawlers) get SVG instead of 404.html
          // The service worker will intercept and override with dynamic content for browsers
          const ogImageSvgPath = join(options.dir, "og-image.svg");
          writeFileSync(ogImageSvgPath, fallbackSvg);

          // Update HTML with fallback image URL and base tag
          let html = readFileSync(htmlPath, "utf-8");

          // Inject base tag if base path is not root
          if (basePath !== "/") {
            // Normalize: ensure it starts with / and ends with /
            const normalizedBasePath = `/${basePath.replace(/^\/|\/$/g, "")}/`;
            const baseTag = `<base href="${normalizedBasePath}" />`;
            html = html.replace(/<head>/, `<head>\n    ${baseTag}`);
          }

          // Use fallback image for static hosting (works for crawlers)
          // The service worker will handle dynamic images in browsers
          const fallbackImageUrl = `${baseUrl}/og-image-fallback.svg`;
          html = html.replace(
            /<meta property="og:url" content="[^"]*" \/>/g,
            `<meta property="og:url" content="${baseUrl}" />`
          );
          html = html.replace(
            /<meta property="og:image" content="[^"]*" \/>/g,
            `<meta property="og:image" content="${fallbackImageUrl}" />`
          );
          html = html.replace(
            /<meta name="twitter:image" content="[^"]*" \/>/g,
            `<meta name="twitter:image" content="${fallbackImageUrl}" />`
          );

          writeFileSync(htmlPath, html);

          // Copy index.html to 404.html for GitHub Pages SPA routing
          // GitHub Pages will serve 404.html for any 404 requests,
          // allowing client-side routing to work
          const notFoundHtmlPath = join(options.dir, "404.html");
          writeFileSync(notFoundHtmlPath, html);
        } catch (error) {
          // File might not exist yet, that's okay
        }
      }
    },
  };
}
