import type { Plugin } from "vite";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { generateFallbackSVG } from "../utils/generateFallbackSVG";

export function buildPlugin(baseUrl: string): Plugin {
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

          // Update HTML with fallback image URL
          let html = readFileSync(htmlPath, "utf-8");

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
        } catch (error) {
          // File might not exist yet, that's okay
        }
      }
    },
  };
}
