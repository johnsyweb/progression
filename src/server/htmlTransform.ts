import type { Plugin } from "vite";
import type { IncomingMessage } from "http";
import { getProgressBarData } from "../progressBar";
import { generateStatusText } from "../utils/progressStatus";

export function htmlTransformPlugin(basePath: string = "/"): Plugin {
  return {
    name: "html-transform",
    configureServer(server) {
      const originalUrlMap = new WeakMap<IncomingMessage, string>();

      server.middlewares.use((req, res, next) => {
        if (req.url && !req.url.startsWith("/@")) {
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
            const normalizedBasePath =
              basePath === "/" ? "" : basePath.replace(/\/$/, "");
            const ogImagePath =
              normalizedBasePath === ""
                ? "/assets/screenshot.png"
                : `${normalizedBasePath}/assets/screenshot.png`;
            const ogImageUrl = origin + ogImagePath;

            let dataPath = path;
            if (basePath !== "/" && path.startsWith(basePath)) {
              dataPath = path.slice(basePath.length) || "/";
            }
            const progressData = getProgressBarData(dataPath);
            const ogTitle = `${progressData.title} | www.johnsy.com`;
            const ogDescription = generateStatusText(progressData);

            let html = responseData.toString("utf-8");

            if (basePath !== "/" && !html.includes("<base")) {
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
