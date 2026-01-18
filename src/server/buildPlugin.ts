import type { Plugin } from "vite";
import { readFileSync, writeFileSync, readdirSync, statSync, copyFileSync, mkdirSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { transpileModule, ModuleKind, ScriptTarget } from "typescript";
import { generateFallbackSVG } from "../utils/generateFallbackSVG";
import { generateSitemap } from "../utils/generateSitemap";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to recursively copy directory
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
            chunk.dynamicImports = chunk.dynamicImports.filter(
              (imp) => imp !== "sw.js"
            );
          }
          // Remove import statements referencing sw.js from code
          chunk.code = chunk.code.replace(
            /import\s+[^'"]*from\s+['"]\.\/sw\.js['"];?/g,
            ""
          );
          chunk.code = chunk.code.replace(/import\s+['"]\.\/sw\.js['"];?/g, "");
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
            importedCode = importedCode.replace(
              /import\s+[^;]*?from\s+['"][^'"]*?['"];?/g,
              ""
            );
            importedCode = importedCode.replace(
              /import\s*\([^)]*?\)/g,
              "Promise.resolve()"
            );
            // Remove all export statements
            importedCode = importedCode.replace(/export\s*\{[^}]*?\};?/g, "");
            importedCode = importedCode.replace(
              /export\s+default[^;]*?;?/g,
              ""
            );
            importedCode = importedCode.replace(
              /export\s+(?:const|let|var|function|class|async)[^;]*?;?/g,
              ""
            );
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
        const lines = swChunk.code.split("\n");
        const filteredLines = lines.filter((line) => {
          const trimmed = line.trim();
          // Remove lines that start with import or contain import statements
          if (
            trimmed.startsWith("import ") ||
            trimmed.startsWith("import{") ||
            /^import\s*\(/.test(trimmed)
          ) {
            return false;
          }
          // Remove export statements
          if (
            trimmed.startsWith("export ") ||
            trimmed.startsWith("export{") ||
            trimmed.startsWith("export default")
          ) {
            return false;
          }
          // Remove import statements in the middle of a line (shouldn't happen but be safe)
          if (/import\s+(?:.*?\s+from\s+)?['"]/.test(trimmed)) {
            return false;
          }
          return true;
        });
        swChunk.code = filteredLines.join("\n");

        // Final pass: remove any remaining import/export patterns that might span lines
        swChunk.code = swChunk.code.replace(
          /import\s+[^;]*?from\s+['"][^'"]*?['"];?/g,
          ""
        );
        swChunk.code = swChunk.code.replace(
          /import\s*\([^)]*?\)/g,
          "Promise.resolve()"
        );
        swChunk.code = swChunk.code.replace(/export\s*\{[^}]*?\};?/g, "");
        swChunk.code = swChunk.code.replace(/export\s+default[^;]*?;?/g, "");
        swChunk.code = swChunk.code.replace(
          /export\s+(?:const|let|var|function|class|async)[^;]*?;?/g,
          ""
        );

        // Ensure service worker event listeners are included
        // Vite may not include top-level side-effect code, so we append it
        // Check if event listeners are missing and add them
        if (!swChunk.code.includes("addEventListener")) {
          // Before extracting event listeners, ensure generateProgressBarSVG is accessible
          // The function might be minified (e.g., to 'U'), so we need to create an alias
          // Extract the minified function name by finding the exported function
          // Since we can't easily map minified names, we'll wrap it in the extracted code itself
          // Or better: extract the function definition along with the event listeners
          const swSourcePath = resolve(__dirname, "../sw.ts");
          try {
            const swSource = readFileSync(swSourcePath, "utf-8");
            // Extract all code after the imports and declare statement (lines 18 onwards)
            // This includes all event listeners and the getServiceWorkerBasePath function
            const lines = swSource.split("\n");
            // Skip the import statement and declare statement (first 3 lines)
            // Then take everything from the getServiceWorkerBasePath function onwards
            let startIdx = 0;
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim();
              if (
                line.includes("function getServiceWorkerBasePath") ||
                line.includes("self.addEventListener")
              ) {
                startIdx = i;
                break;
              }
            }
            const eventListenerCodeRaw = lines.slice(startIdx).join("\n");

            // Remove the import and declare statements (TypeScript compiler will handle types)
            let eventListenerCode = eventListenerCodeRaw
              .replace(/^import[^]*?from[^;]*?;?\s*/m, "")
              .replace(/^declare\s+const[^;]*?;?\s*/m, "");

            // Use TypeScript compiler to transpile to plain JavaScript
            // This removes all type annotations reliably
            const transpiled = transpileModule(eventListenerCode, {
              compilerOptions: {
                target: ScriptTarget.ESNext,
                module: ModuleKind.None, // Plain JS, no modules
                removeComments: false,
                esModuleInterop: true,
              },
            });

            eventListenerCode = transpiled.outputText;

            // Replace generateProgressBarSVG calls with the minified function name
            // The minified bundle has the function, but we need to find its name
            // Look for function with <svg string literal containing 1200 and 630 (minified code is all on one line)
            // Pattern matches: function U(t){...<svg width="${s}" height="${r}"...} where s=1200, r=630
            const svgFuncRegex =
              /function\s+(\w+)\s*\([^)]*\)\s*\{[^<]*<svg[^<]*1200[^<]*630/;
            const svgFunctionMatch = swChunk.code.match(svgFuncRegex);
            if (svgFunctionMatch && svgFunctionMatch[1]) {
              const minifiedName = svgFunctionMatch[1];
              // Replace generateProgressBarSVG with the minified name in event listener code
              eventListenerCode = eventListenerCode.replace(
                /generateProgressBarSVG/g,
                minifiedName
              );
            } else {
              // Fallback: try simpler pattern matching function with both 1200 and 630
              const fallbackPattern =
                /function\s+(\w+)\s*\([^)]*\)\s*\{[^}]*1200[^}]*630/;
              const fallbackMatch = swChunk.code.match(fallbackPattern);
              if (fallbackMatch && fallbackMatch[1]) {
                eventListenerCode = eventListenerCode.replace(
                  /generateProgressBarSVG/g,
                  fallbackMatch[1]
                );
              } else {
                console.warn(
                  "Could not find minified SVG function name, service worker may fail"
                );
              }
            }

            if (eventListenerCode) {
              swChunk.code = swChunk.code + "\n\n" + eventListenerCode;
            }
          } catch (err) {
            // If we can't read the source, continue without it
            console.warn(
              "Could not read sw.ts source to extract event listeners:",
              err
            );
          }
        }
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

          // Generate and write sitemap.xml
          const sitemap = generateSitemap(baseUrl, basePath);
          const sitemapPath = join(options.dir, "sitemap.xml");
          writeFileSync(sitemapPath, sitemap);

          // Copy assets directory to dist for deployment
          const assetsSourceDir = resolve(process.cwd(), "assets");
          const assetsDestDir = join(options.dir, "assets");
          try {
            // Check if source assets directory exists
            const sourceStat = statSync(assetsSourceDir);
            if (sourceStat.isDirectory()) {
              copyDirectory(assetsSourceDir, assetsDestDir);
            }
          } catch {
            // Assets directory might not exist, that's okay
          }
        } catch {
          // File might not exist yet, that's okay
        }
      }
    },
  };
}
