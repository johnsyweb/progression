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
  const expectedPngPath =
    normalizedBasePath === "/" ? "/og-image.png" : `${normalizedBasePath}/og-image.png`;
  const expectedSvgPath =
    normalizedBasePath === "/" ? "/og-image.svg" : `${normalizedBasePath}/og-image.svg`;

  // Check if this is a PNG or SVG image request
  // Match both exact path and any path ending with /og-image.png or /og-image.svg
  const isPngRequest = requestUrl.pathname === expectedPngPath || requestUrl.pathname.endsWith("/og-image.png");
  const isSvgRequest = requestUrl.pathname === expectedSvgPath || requestUrl.pathname.endsWith("/og-image.svg");
  
  if (isPngRequest || isSvgRequest) {
    // Service worker is intercepting - prevent default fetch
    event.respondWith(
      (async () => {
        // Re-read the URL from the request to ensure we have the current query params
        const url = new URL(event.request.url);
        console.log("[SW] Intercepting image request:", url.pathname, "basePath:", basePath, "full URL:", url.toString(), "path param:", url.searchParams.get("path"));
        
        let path = url.searchParams.get("path") || "";
        if (basePath !== "/" && path.startsWith(basePath)) {
          path = path.slice(basePath.length) || "/";
        }
        
        // Ensure path starts with / for proper parsing
        if (!path.startsWith("/")) {
          path = "/" + path;
        }

        // Generate pure SVG (no foreignObject) - this works reliably with createImageBitmap
        console.log("[SW] Generating SVG for path:", path);
        console.log("[SW] Full request URL:", event.request.url);
        console.log("[SW] Path parameter from URL:", url.searchParams.get("path"));
        const svg = generateProgressBarSVG(path);
        console.log("[SW] SVG generated, length:", svg.length);
        // Log a snippet of the SVG to verify it's different for different paths
        const svgTitleMatch = svg.match(/<text[^>]*>([^<]+)<\/text>/);
        console.log("[SW] SVG title:", svgTitleMatch ? svgTitleMatch[1] : "not found");

        // If this is an SVG request, return the SVG directly
        if (isSvgRequest) {
          return new Response(svg, {
            headers: {
              "Content-Type": "image/svg+xml",
              "Cache-Control": "public, max-age=3600",
              // Add Vary header to ensure different query params are cached separately
              "Vary": "Accept",
            },
          });
        }

        // Otherwise, convert SVG to PNG
        try {
          // Convert SVG to PNG using OffscreenCanvas
          if (typeof OffscreenCanvas === "undefined") {
            throw new Error("OffscreenCanvas not available");
          }
          
          const canvas = new OffscreenCanvas(1200, 630);
          const ctx = canvas.getContext("2d");
          
          if (!ctx) {
            throw new Error("Could not get 2d context");
          }
          
          // Convert SVG string to Blob with proper encoding
          const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
          
          // Create an object URL for the SVG blob
          const svgUrl = URL.createObjectURL(svgBlob);
          
          try {
            // Fetch the SVG as an image
            const imgResponse = await fetch(svgUrl);
            if (!imgResponse.ok) {
              throw new Error(`Failed to fetch SVG: ${imgResponse.status}`);
            }
            
            const imgBlob = await imgResponse.blob();
            
            // Create image bitmap from the fetched blob
            const imageBitmap = await createImageBitmap(imgBlob, {
              resizeWidth: 1200,
              resizeHeight: 630,
              resizeQuality: "high",
            });
            
            // Draw to canvas
            ctx.drawImage(imageBitmap, 0, 0);
            imageBitmap.close();
            
            // Clean up object URL
            URL.revokeObjectURL(svgUrl);
            
            const pngBlob = await canvas.convertToBlob({ type: "image/png", quality: 1.0 });
            
            return new Response(pngBlob, {
              headers: {
                "Content-Type": "image/png",
                "Cache-Control": "public, max-age=3600",
              },
            });
          } catch (fetchError) {
            // Clean up object URL on error
            URL.revokeObjectURL(svgUrl);
            throw fetchError;
          }
          
        } catch (error) {
          // Log the error for debugging
          console.error("PNG conversion failed:", error);
          // If PNG conversion fails, fallback to SVG
          // This ensures we always return something valid
          return new Response(svg, {
            headers: {
              "Content-Type": "image/svg+xml",
              "Cache-Control": "public, max-age=3600",
            },
          });
        }
      })()
    );
  }
});
