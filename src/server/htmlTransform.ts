import type { Plugin } from "vite";
import type { IncomingMessage } from "http";
import { getProgressBarData } from "../progressBar";
import { generateStatusText } from "../utils/svgGenerator";
import { generateProgressBarSVG } from "../utils/svgGenerator";

export function htmlTransformPlugin(basePath: string = "/"): Plugin {
  return {
    name: "html-transform",
    configureServer(server) {
      // Service worker is not supported in dev mode
      // Use `pnpm run build && pnpm run preview` to test service worker functionality
      server.middlewares.use("/sw.js", (req, res) => {
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/plain");
        res.end(
          "Service worker is not available in dev mode. Use `pnpm run build && pnpm run preview` to test service worker functionality."
        );
      });
      
      // Handle og-image.svg requests - render progress container to SVG
      server.middlewares.use("/og-image.svg", async (req, res) => {
        try {
          const url = new URL(req.url || "", `http://${req.headers.host}`);
          let path = url.searchParams.get("path") || "";

          // Strip base path from the path parameter if present
          if (basePath !== "/" && path.startsWith(basePath)) {
            path = path.slice(basePath.length) || "/";
          }

          // Ensure path starts with / for proper parsing
          if (!path.startsWith("/")) {
            path = "/" + path;
          }

          const svg = generateProgressBarSVG(path);

          res.setHeader("Content-Type", "image/svg+xml");
          res.setHeader("Cache-Control", "public, max-age=3600");
          res.end(svg);
        } catch (error) {
          res.statusCode = 500;
          res.end(`Error generating image: ${error}`);
        }
      });
      const originalUrlMap = new WeakMap<IncomingMessage, string>();

      server.middlewares.use((req, res, next) => {
        if (
          req.url &&
          !req.url.startsWith("/@") &&
          !req.url.startsWith("/og-image.svg")
        ) {
          originalUrlMap.set(req, req.url);
        }
        next();
      });

      server.middlewares.use((req, res, next) => {
        const originalEnd = res.end.bind(res);
        let responseData = Buffer.alloc(0);

        res.write = function (chunk: unknown) {
          if (chunk) {
            const buffer =
              typeof chunk === "string"
                ? Buffer.from(chunk)
                : Buffer.isBuffer(chunk)
                  ? chunk
                  : Buffer.from(String(chunk));
            responseData = Buffer.concat([responseData, buffer]);
          }
          return true;
        };

        res.end = function (chunk?: unknown) {
          if (chunk) {
            const buffer =
              typeof chunk === "string"
                ? Buffer.from(chunk)
                : Buffer.isBuffer(chunk)
                  ? chunk
                  : Buffer.from(String(chunk));
            responseData = Buffer.concat([responseData, buffer]);
          }

          const contentType = res.getHeader("content-type");
          if (
            contentType &&
            typeof contentType === "string" &&
            contentType.includes("text/html")
          ) {
            let path = originalUrlMap.get(req) || req.url || "/";

            if (path === "/index.html" || path.endsWith("/index.html")) {
              path = "/";
            }

            const origin = `http://${req.headers.host || "localhost:5173"}`;
            const ogUrl = origin + (path === "/" ? "" : path);
            const normalizedBasePath = basePath === "/" ? "" : basePath.replace(/\/$/, "");
            const ogImagePath = normalizedBasePath === "" ? "/og-image.svg" : `${normalizedBasePath}/og-image.svg`;
            const ogImageUrl =
              origin +
              ogImagePath +
              "?path=" +
              encodeURIComponent(path === "/" ? "" : path);

            // Strip base path from path for getProgressBarData
            let dataPath = path;
            if (basePath !== "/" && path.startsWith(basePath)) {
              dataPath = path.slice(basePath.length) || "/";
            }
            const progressData = getProgressBarData(dataPath);
            const ogTitle = `${progressData.title} | www.johnsy.com`;
            const ogDescription = generateStatusText(progressData);

            let html = responseData.toString("utf-8");

            // Inject base tag if base path is not root
            if (basePath !== "/" && !html.includes("<base")) {
              // Normalize: ensure it starts with / and ends with /
              const normalizedBasePath = `/${basePath.replace(/^\/|\/$/g, "")}/`;
              const baseTag = `<base href="${normalizedBasePath}" />`;
              html = html.replace(/<head>/, `<head>\n    ${baseTag}`);
            }

            html = html.replace(
              '<meta property="og:title" content="Progress | www.johnsy.com" />',
              `<meta property="og:title" content="${ogTitle.replace(/"/g, "&quot;")}" />`
            );
            html = html.replace(
              '<meta property="og:url" content="" />',
              `<meta property="og:url" content="${ogUrl}" />`
            );
            html = html.replace(
              '<meta property="og:description" content="" />',
              `<meta property="og:description" content="${ogDescription.replace(/"/g, "&quot;")}" />`
            );
            html = html.replace(
              '<meta property="og:image" content="" />',
              `<meta property="og:image" content="${ogImageUrl}" />`
            );
            html = html.replace(
              '<meta name="twitter:image" content="" />',
              `<meta name="twitter:image" content="${ogImageUrl}" />`
            );

            res.setHeader("Content-Length", Buffer.byteLength(html));
            return originalEnd(html);
          } else {
            return originalEnd(chunk);
          }
        } as typeof res.end;

        next();
      });
    },
  };
}
