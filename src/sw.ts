import { generateProgressBarSVG } from "./utils/svgGenerator";

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("fetch", (event: FetchEvent) => {
  const url = new URL(event.request.url);

  if (url.pathname === "/og-image.svg") {
    event.respondWith(
      (async () => {
        const path = url.searchParams.get("path") || "";
        const svg = generateProgressBarSVG(path);

        return new Response(svg, {
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      })()
    );
  }
});
