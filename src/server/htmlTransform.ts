import type { Plugin } from "vite";
import { generateProgressBarSVG } from "../utils/svgGenerator";

export function htmlTransformPlugin(basePath: string = "/"): Plugin {
  return {
    name: "html-transform",
    configureServer(server) {
      server.middlewares.use("/og-image.svg", (req, res) => {
        const url = new URL(req.url || "", `http://${req.headers.host}`);
        const path = url.searchParams.get("path") || "";

        const svg = generateProgressBarSVG(path);

        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Cache-Control", "public, max-age=3600");
        res.end(svg);
      });
      const originalUrlMap = new WeakMap<
        typeof server.middlewares extends (
          req: infer R,
          res: any,
          next: any
        ) => any
          ? R
          : never,
        string
      >();

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
            const ogImageUrl =
              origin +
              "/og-image.svg?path=" +
              encodeURIComponent(path === "/" ? "" : path);

            let html = responseData.toString("utf-8");

            // Inject base tag if base path is not root
            if (basePath !== "/" && !html.includes("<base")) {
              // Normalize: ensure it starts with / and ends with /
              const normalizedBasePath = `/${basePath.replace(/^\/|\/$/g, "")}/`;
              const baseTag = `<base href="${normalizedBasePath}" />`;
              html = html.replace(/<head>/, `<head>\n    ${baseTag}`);
            }

            html = html.replace(
              '<meta property="og:url" content="" />',
              `<meta property="og:url" content="${ogUrl}" />`
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
