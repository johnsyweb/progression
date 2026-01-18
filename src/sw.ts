import { generateProgressBarSVG } from "./utils/svgGenerator";

declare const self: ServiceWorkerGlobalScope;

function getServiceWorkerBasePath(): string {
  const scope = self.registration?.scope || self.location.href;
  const scopeUrl = new URL(scope);
  let pathname = scopeUrl.pathname;
  
  // Remove trailing slash
  pathname = pathname.replace(/\/$/, "") || "/";
  
  // If pathname ends with sw.js, remove it to get the base path
  // Otherwise, the pathname itself is the base path (e.g., "/progression")
  if (pathname.endsWith("/sw.js")) {
    return pathname.replace(/\/sw\.js$/, "") || "/";
  }
  
  // If pathname is just "/", return it
  if (pathname === "/") {
    return "/";
  }
  
  // Otherwise, pathname is the base path (e.g., "/progression")
  return pathname;
}

// No CSS needed - we use pure SVG generation

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event: FetchEvent) => {
  // Create URL object from the request URL to ensure we get fresh query params
  const requestUrl = new URL(event.request.url);
  const basePath = getServiceWorkerBasePath();
  const normalizedBasePath = basePath === "/" ? "/" : basePath.replace(/\/$/, "");
  const expectedSvgPath =
    normalizedBasePath === "/" ? "/og-image.svg" : `${normalizedBasePath}/og-image.svg`;

  // Check if this is an SVG image request
  // Match both exact path and any path ending with /og-image.svg
  const isSvgRequest = requestUrl.pathname === expectedSvgPath || requestUrl.pathname.endsWith("/og-image.svg");
  
  if (isSvgRequest) {
    // Service worker is intercepting - prevent default fetch
    event.respondWith(
      (async () => {
        // Re-read the URL from the request to ensure we have the current query params
        const url = new URL(event.request.url);
        
        let path = url.searchParams.get("path") || "";
        if (basePath !== "/" && path.startsWith(basePath)) {
          path = path.slice(basePath.length) || "/";
        }
        
        // Ensure path starts with / for proper parsing
        if (!path.startsWith("/")) {
          path = "/" + path;
        }

        // Generate pure SVG
        const svg = generateProgressBarSVG(path);

        // Return the SVG directly
        return new Response(svg, {
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "public, max-age=3600",
            // Add Vary header to ensure different query params are cached separately
            "Vary": "Accept",
          },
        });
      })()
    );
  }
});
