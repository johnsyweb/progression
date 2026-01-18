import type { Plugin } from "vite";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { generateFallbackSVG } from "../utils/generateFallbackSVG";

export function buildPlugin(baseUrl: string, basePath: string): Plugin {
  return {
    name: "build-plugin",
    generateBundle(options, bundle) {
      // Rollup bundles everything, but service workers can't use ES modules
      // If the service worker has imports, we need to inline them recursively
      // Also ensure main.js never imports from sw.js
      
      // First, remove any imports of sw.js from other chunks
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === "chunk" && fileName !== "sw.js") {
          // Remove sw.js from imports and dynamicImports
          if (chunk.imports) {
            chunk.imports = chunk.imports.filter((imp) => imp !== "sw.js");
          }
          if (chunk.dynamicImports) {
            chunk.dynamicImports = chunk.dynamicImports.filter((imp) => imp !== "sw.js");
          }
          // Remove import statements referencing sw.js from code
          chunk.code = chunk.code.replace(/import\s+[^'"]*from\s+['"]\.\/sw\.js['"];?/g, '');
          chunk.code = chunk.code.replace(/import\s+['"]\.\/sw\.js['"];?/g, '');
        }
      }
      
      if (bundle["sw.js"] && bundle["sw.js"].type === "chunk") {
        const swChunk = bundle["sw.js"];
        const inlinedChunks = new Set<string>();
        
        // Recursively inline all dependencies
        const inlineDependencies = (chunkName: string) => {
          if (inlinedChunks.has(chunkName)) {
            return; // Already inlined
          }
          
          const chunk = bundle[chunkName];
          if (!chunk || chunk.type !== "chunk") {
            return;
          }
          
          inlinedChunks.add(chunkName);
          
          // First, inline all dependencies of this chunk
          if (chunk.imports && chunk.imports.length > 0) {
            for (const importPath of chunk.imports) {
              inlineDependencies(importPath);
            }
          }
          
          // Then prepend this chunk's code (with imports and exports removed)
          if (chunkName !== "sw.js") {
            let importedCode = chunk.code;
            // Remove all import statements
            importedCode = importedCode.replace(/import\s+[^;]*?from\s+['"][^'"]*?['"];?/g, '');
            importedCode = importedCode.replace(/import\s*\([^)]*?\)/g, 'Promise.resolve()');
            // Remove all export statements
            importedCode = importedCode.replace(/export\s*\{[^}]*?\};?/g, "");
            importedCode = importedCode.replace(/export\s+default[^;]*?;?/g, '');
            importedCode = importedCode.replace(/export\s+(?:const|let|var|function|class|async)[^;]*?;?/g, '');
            swChunk.code = importedCode + "\n" + swChunk.code;
          }
        };
        
        // Start inlining from sw.js's direct imports
        if (swChunk.imports && swChunk.imports.length > 0) {
          for (const importPath of swChunk.imports) {
            inlineDependencies(importPath);
          }
        }
        
        // Clear imports after inlining - this prevents main.js from importing from sw.js
        swChunk.imports = [];
        swChunk.dynamicImports = [];
        
        // Remove any remaining import/export statements (safety net)
        // Process line by line to catch all import/export statements reliably
        const lines = swChunk.code.split('\n');
        const filteredLines = lines.filter((line) => {
          const trimmed = line.trim();
          // Remove lines that start with import or contain import statements
          if (trimmed.startsWith('import ') || trimmed.startsWith('import{') || /^import\s*\(/.test(trimmed)) {
            return false;
          }
          // Remove export statements
          if (trimmed.startsWith('export ') || trimmed.startsWith('export{') || trimmed.startsWith('export default')) {
            return false;
          }
          // Remove import statements in the middle of a line (shouldn't happen but be safe)
          if (/import\s+(?:.*?\s+from\s+)?['"]/.test(trimmed)) {
            return false;
          }
          return true;
        });
        swChunk.code = filteredLines.join('\n');
        
        // Final pass: remove any remaining import/export patterns that might span lines
        swChunk.code = swChunk.code.replace(/import\s+[^;]*?from\s+['"][^'"]*?['"];?/g, '');
        swChunk.code = swChunk.code.replace(/import\s*\([^)]*?\)/g, 'Promise.resolve()');
        swChunk.code = swChunk.code.replace(/export\s*\{[^}]*?\};?/g, '');
        swChunk.code = swChunk.code.replace(/export\s+default[^;]*?;?/g, '');
        swChunk.code = swChunk.code.replace(/export\s+(?:const|let|var|function|class|async)[^;]*?;?/g, '');
      }
    },
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
          
          // Create a static og-image.png placeholder file
          // This prevents 404.html from being served before service worker intercepts
          // The service worker will intercept and override with dynamic PNG for browsers
          // For now, create a minimal 1x1 transparent PNG as placeholder
          const transparentPng = Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            "base64"
          );
          const ogImagePngPath = join(options.dir, "og-image.png");
          writeFileSync(ogImagePngPath, transparentPng);

          // Update HTML with fallback image URL and base tag
          let html = readFileSync(htmlPath, "utf-8");

          // Inject base tag if base path is not root
          if (basePath !== "/") {
            // Normalize: ensure it starts with / and ends with /
            const normalizedBasePath = `/${basePath.replace(/^\/|\/$/g, "")}/`;
            const baseTag = `<base href="${normalizedBasePath}" />`;
            html = html.replace(/<head>/, `<head>\n    ${baseTag}`);
          }

          // Don't overwrite OG tags here - they're set dynamically by main.ts
          // The build plugin should only set base tag and create fallback files

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
