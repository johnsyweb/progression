import { generateProgressBarSVG } from "./utils/svgGenerator";

declare const self: ServiceWorkerGlobalScope;

function getBasePathFromScope(): string {
  // Extract base path from service worker scope
  // The scope URL tells us the base path
  const scope = self.registration?.scope || self.location.href;
  const scopeUrl = new URL(scope);
  const pathname = scopeUrl.pathname;
  // Remove trailing slash and any filename (like sw.js)
  const basePath = pathname.replace(/\/[^/]*$/, "") || "/";
  return basePath === "/" ? "/" : basePath;
}

self.addEventListener("fetch", (event: FetchEvent) => {
  const url = new URL(event.request.url);
  const basePath = getBasePathFromScope();
  const expectedPath =
    basePath === "/" ? "/og-image.svg" : `${basePath}/og-image.svg`;

  if (url.pathname === expectedPath) {
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
